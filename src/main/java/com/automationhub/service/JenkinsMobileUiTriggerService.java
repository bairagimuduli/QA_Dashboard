package com.automationhub.service;

import com.automationhub.config.JenkinsProperties;
import com.automationhub.web.dto.JenkinsParameterFieldDto;
import com.automationhub.web.dto.MobileUiParameterDefinitionsDto;
import com.automationhub.web.dto.MobileUiRunStatusDto;
import com.automationhub.web.dto.MobileUiTriggerResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.automationhub.service.JenkinsApiService.jobFullNameToPath;

@Service
public class JenkinsMobileUiTriggerService {

    private static final int CONSOLE_TAIL_MAX = 200_000;
    private static final Pattern QUEUE_ITEM_PATTERN = Pattern.compile(".*/queue/item/(\\d+)/?");

    private final JenkinsProperties properties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public JenkinsMobileUiTriggerService(
            JenkinsProperties properties, RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.properties = properties;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public MobileUiParameterDefinitionsDto loadParameterDefinitions(String pipelineKey) {
        String job = resolveJobFullName(pipelineKey);
        String base = normalizedBaseUrl();
        if (base.isEmpty() || job.isEmpty()) {
            return fallbackDefinitions(pipelineKey, job, "missing-config");
        }
        if (!credentialsOk()) {
            return fallbackDefinitions(pipelineKey, job, "no-credentials");
        }
        try {
            String url =
                    base + jobFullNameToPath(job) + "api/json";
            HttpHeaders headers = authHeaders();
            ResponseEntity<String> r =
                    restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), String.class);
            JsonNode root = objectMapper.readTree(r.getBody());
            List<JenkinsParameterFieldDto> parsed = parseParameterDefinitions(root);
            if (parsed.isEmpty()) {
                return fallbackDefinitions(pipelineKey, job, "jenkins-parse-empty");
            }
            return new MobileUiParameterDefinitionsDto(pipelineKey, job, "jenkins", parsed);
        } catch (Exception e) {
            return fallbackDefinitions(pipelineKey, job, "jenkins-error");
        }
    }

    private MobileUiParameterDefinitionsDto fallbackDefinitions(String pipelineKey, String jobFullName, String reason) {
        boolean includeBranch = "jenkinsfileTest".equals(pipelineKey);
        Map<String, List<String>> map = MobileUiParameterDefaults.asChoiceMap(includeBranch);
        List<JenkinsParameterFieldDto> fields = new ArrayList<>();
        for (Map.Entry<String, List<String>> e : map.entrySet()) {
            String def = e.getValue().isEmpty() ? "" : e.getValue().get(0);
            fields.add(new JenkinsParameterFieldDto(e.getKey(), "choice", e.getValue(), def));
        }
        return new MobileUiParameterDefinitionsDto(pipelineKey, jobFullName, "fallback:" + reason, fields);
    }

    /**
     * Parses {@code property[]} → {@code parameterDefinitions} from Jenkins job JSON.
     */
    List<JenkinsParameterFieldDto> parseParameterDefinitions(JsonNode jobRoot) {
        List<JenkinsParameterFieldDto> out = new ArrayList<>();
        JsonNode property = jobRoot.get("property");
        if (property == null || !property.isArray()) {
            return out;
        }
        for (JsonNode prop : property) {
            JsonNode defs = prop.get("parameterDefinitions");
            if (defs == null || !defs.isArray()) {
                continue;
            }
            for (JsonNode def : defs) {
                String name = text(def, "name");
                if (name.isEmpty()) {
                    continue;
                }
                String clazz = text(def, "_class");
                String type = clazz.contains("Choice") ? "choice" : "string";
                List<String> choices = new ArrayList<>();
                JsonNode ch = def.get("choices");
                if (ch != null && ch.isArray()) {
                    for (JsonNode c : ch) {
                        if (c.isTextual()) {
                            choices.add(c.asText());
                        } else if (c.isObject() && c.has("value")) {
                            choices.add(c.get("value").asText(""));
                        }
                    }
                }
                String defaultValue = "";
                JsonNode d = def.get("defaultParameterValue");
                if (d != null && d.has("value")) {
                    JsonNode v = d.get("value");
                    defaultValue = v.isNull() ? "" : v.asText("");
                }
                out.add(new JenkinsParameterFieldDto(name, type, choices, defaultValue));
            }
        }
        return out;
    }

    private static String text(JsonNode n, String field) {
        JsonNode x = n.get(field);
        return x == null || x.isNull() ? "" : x.asText("");
    }

    public MobileUiTriggerResponse trigger(String pipelineKey, Map<String, String> parameters) {
        if (!credentialsOk()) {
            throw new IllegalStateException("Jenkins credentials are not configured on the server.");
        }
        String base = normalizedBaseUrl();
        String job = resolveJobFullName(pipelineKey);
        if (base.isEmpty() || job.isEmpty()) {
            throw new IllegalStateException("Jenkins base URL or job name is not configured.");
        }
        validateParams(pipelineKey, parameters);

        String buildUrl = base + jobFullNameToPath(job) + "buildWithParameters";
        try {
            return triggerBuildWithSessionCookie(base, buildUrl, job, parameters);
        } catch (IllegalStateException e) {
            throw e;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Jenkins trigger interrupted", e);
        } catch (Exception e) {
            throw new IllegalStateException("Jenkins trigger failed: " + e.getMessage(), e);
        }
    }

    /**
     * Jenkins CSRF expects a session cookie from the crumb issuer plus the crumb header; RestTemplate does not keep
     * cookies between calls. We also POST parameters as {@code application/x-www-form-urlencoded} (same as the UI).
     */
    private MobileUiTriggerResponse triggerBuildWithSessionCookie(
            String baseUrl, String buildWithParametersUrl, String jobFullName, Map<String, String> parameters)
            throws Exception {
        CookieManager cookies = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
        HttpClient client =
                HttpClient.newBuilder()
                        .cookieHandler(cookies)
                        .connectTimeout(Duration.ofSeconds(45))
                        .build();

        String basic =
                "Basic "
                        + Base64.getEncoder()
                                .encodeToString(
                                        (properties.getUsername() + ":" + properties.getApiToken())
                                                .getBytes(StandardCharsets.UTF_8));

        String crumbValue = "";
        String crumbHeaderName = "Jenkins-Crumb";
        HttpRequest crumbGet =
                HttpRequest.newBuilder(URI.create(baseUrl + "/crumbIssuer/api/json"))
                        .timeout(Duration.ofSeconds(30))
                        .header("Authorization", basic)
                        .GET()
                        .build();
        HttpResponse<String> crumbRes = client.send(crumbGet, HttpResponse.BodyHandlers.ofString());
        if (crumbRes.statusCode() == 200 && crumbRes.body() != null && !crumbRes.body().isBlank()) {
            JsonNode cj = objectMapper.readTree(crumbRes.body());
            crumbValue = cj.path("crumb").asText("");
            String cf = cj.path("crumbRequestField").asText("");
            if (!cf.isBlank()) {
                crumbHeaderName = cf;
            }
        }

        String form = buildFormBody(parameters);
        HttpRequest.Builder postB =
                HttpRequest.newBuilder(URI.create(buildWithParametersUrl))
                        .timeout(Duration.ofMinutes(3))
                        .header("Authorization", basic)
                        .header("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
                        .POST(HttpRequest.BodyPublishers.ofString(form));
        if (!crumbValue.isBlank()) {
            postB.header(crumbHeaderName, crumbValue);
        }
        HttpResponse<String> postRes = client.send(postB.build(), HttpResponse.BodyHandlers.ofString());

        int code = postRes.statusCode();
        if (code != 200 && code != 201) {
            throw new IllegalStateException(
                    "Jenkins trigger failed: " + code + " " + humanizeJenkinsErrorBody(postRes.body()));
        }

        long queueId = extractQueueIdFromHttpClientHeaders(postRes.headers(), baseUrl);
        if (queueId <= 0) {
            throw new IllegalStateException(
                    "Jenkins did not return a queue Location header. Response: "
                            + humanizeJenkinsErrorBody(postRes.body()));
        }
        return new MobileUiTriggerResponse(queueId, jobFullName);
    }

    private static String buildFormBody(Map<String, String> parameters) {
        return parameters.entrySet().stream()
                .filter(e -> e.getValue() != null)
                .map(
                        e ->
                                e.getKey()
                                        + "="
                                        + java.net.URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));
    }

    private static String humanizeJenkinsErrorBody(String body) {
        if (body == null || body.isBlank()) {
            return "(empty body)";
        }
        Matcher m = Pattern.compile("<title>([^<]+)</title>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL)
                .matcher(body);
        if (m.find()) {
            return m.group(1).trim().replaceAll("\\s+", " ");
        }
        return truncate(body, 400);
    }

    private static long extractQueueIdFromHttpClientHeaders(
            java.net.http.HttpHeaders headers, String baseUrl) {
        List<String> locs = headers.allValues("Location");
        if (locs.isEmpty()) {
            locs = headers.allValues("location");
        }
        if (locs.isEmpty()) {
            return -1;
        }
        String base = baseUrl.replaceAll("/$", "");
        for (String raw : locs) {
            try {
                URI u = URI.create(raw);
                if (!u.isAbsolute()) {
                    u = URI.create(base + (raw.startsWith("/") ? "" : "/") + raw);
                }
                Matcher m = QUEUE_ITEM_PATTERN.matcher(u.toString());
                if (m.find()) {
                    return Long.parseLong(m.group(1));
                }
            } catch (Exception ignored) {
                /* next */
            }
        }
        return -1;
    }

    private void validateParams(String pipelineKey, Map<String, String> parameters) {
        if (parameters == null) {
            throw new IllegalArgumentException("parameters required");
        }
        require(parameters, "ENV");
        require(parameters, "SUITE");
        require(parameters, "APP_BUILD");
        require(parameters, "MAIL_RECIPIENT_EMAIL");
        if ("jenkinsfileTest".equals(pipelineKey)) {
            if (parameters.get("BRANCH_NAME") == null || parameters.get("BRANCH_NAME").isBlank()) {
                parameters.put("BRANCH_NAME", "functional_code");
            }
        }
    }

    private static void require(Map<String, String> m, String key) {
        if (m.get(key) == null || m.get(key).isBlank()) {
            throw new IllegalArgumentException("Missing parameter: " + key);
        }
    }

    /** Poll queue item until build starts, then poll build until finished. */
    public MobileUiRunStatusDto statusByQueueItem(long queueItemId) {
        if (!credentialsOk()) {
            return new MobileUiRunStatusDto(
                    "FAILED",
                    "Jenkins credentials not configured",
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    Map.of());
        }
        String base = normalizedBaseUrl();
        String queueUrl = base + "/queue/item/" + queueItemId + "/api/json";
        String tree = "cancelled,why,blocked,executable[number,url]";
        String fullUrl = JenkinsApiService.apiJsonUrlWithTree(queueUrl, tree);
        try {
            HttpHeaders headers = authHeaders();
            ResponseEntity<String> r =
                    restTemplate.exchange(fullUrl, HttpMethod.GET, new HttpEntity<>(headers), String.class);
            JsonNode q = objectMapper.readTree(r.getBody());
            if (q.path("cancelled").asBoolean(false)) {
                return failStatus("Build was cancelled in queue.");
            }
            JsonNode ex = q.get("executable");
            if (ex != null && !ex.isNull() && ex.has("url")) {
                String buildUrl = ex.get("url").asText("");
                return statusByBuildUrl(buildUrl);
            }
            String why = q.path("why").asText("");
            return new MobileUiRunStatusDto(
                    "QUEUED",
                    why.isEmpty() ? "Waiting in queue…" : why,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    Map.of());
        } catch (HttpStatusCodeException e) {
            if (e.getStatusCode().value() == 404) {
                return failStatus(
                        "Queue item not found (expired or invalid id). If the build already started, poll by job + build number.");
            }
            return failStatus("Queue API: " + e.getStatusCode());
        } catch (Exception e) {
            return failStatus(e.getMessage());
        }
    }

    public MobileUiRunStatusDto statusByJobAndBuild(String jobFullName, int buildNumber) {
        if (!credentialsOk()) {
            return failStatus("Jenkins credentials not configured");
        }
        String base = normalizedBaseUrl();
        String buildUrl = base + jobFullNameToPath(jobFullName) + buildNumber + "/";
        return statusByBuildUrl(buildUrl);
    }

    private MobileUiRunStatusDto statusByBuildUrl(String buildUrl) {
        if (buildUrl.isEmpty()) {
            return failStatus("Empty build URL");
        }
        if (!buildUrl.endsWith("/")) {
            buildUrl = buildUrl + "/";
        }
        String api = buildUrl + "api/json";
        String tree =
                "building,result,duration,timestamp,number,url,actions[parameters[name,value]]";
        String fullUrl = JenkinsApiService.apiJsonUrlWithTree(api, tree);
        try {
            HttpHeaders headers = authHeaders();
            ResponseEntity<String> r =
                    restTemplate.exchange(fullUrl, HttpMethod.GET, new HttpEntity<>(headers), String.class);
            JsonNode b = objectMapper.readTree(r.getBody());
            boolean building = b.path("building").asBoolean(false);
            String result = b.path("result").asText("");
            long duration = b.path("duration").asLong(0);
            long ts = b.path("timestamp").asLong(0);
            int number = b.path("number").asInt(0);
            String url = b.path("url").asText("");
            Map<String, String> params = JenkinsApiService.parseActionsParameters(b.path("actions"));

            String phase = building ? "BUILDING" : "COMPLETED";
            String console = fetchConsoleTail(buildUrl);

            return new MobileUiRunStatusDto(
                    phase,
                    building ? "Build running…" : (result.isEmpty() ? "Finished" : result),
                    extractJobFullNameFromBuildUrl(url),
                    number,
                    url,
                    building,
                    result.isEmpty() ? null : result,
                    duration,
                    ts,
                    console,
                    params);
        } catch (Exception e) {
            return failStatus(e.getMessage());
        }
    }

    static String extractJobFullNameFromBuildUrl(String buildUrl) {
        if (buildUrl == null || buildUrl.isBlank()) {
            return null;
        }
        try {
            java.net.URI u = java.net.URI.create(buildUrl);
            String path = u.getPath();
            List<String> names = new ArrayList<>();
            String[] segs = path.split("/");
            for (int i = 0; i < segs.length; i++) {
                if ("job".equals(segs[i]) && i + 1 < segs.length) {
                    names.add(segs[i + 1]);
                    i++;
                }
            }
            if (names.isEmpty()) {
                return null;
            }
            String last = names.get(names.size() - 1);
            if (last.matches("\\d+")) {
                names.remove(names.size() - 1);
            }
            return String.join("/", names);
        } catch (Exception e) {
            return null;
        }
    }

    private String fetchConsoleTail(String buildUrl) {
        String consoleUrl = buildUrl + "consoleText";
        try {
            HttpHeaders headers = authHeaders();
            ResponseEntity<String> r =
                    restTemplate.exchange(consoleUrl, HttpMethod.GET, new HttpEntity<>(headers), String.class);
            String text = r.getBody() != null ? r.getBody() : "";
            if (text.length() > CONSOLE_TAIL_MAX) {
                return text.substring(text.length() - CONSOLE_TAIL_MAX);
            }
            return text;
        } catch (Exception e) {
            return "(Console log unavailable: " + e.getMessage() + ")";
        }
    }

    private static MobileUiRunStatusDto failStatus(String message) {
        return new MobileUiRunStatusDto("FAILED", message, null, null, null, null, null, null, null, null, Map.of());
    }

    private static String truncate(String s, int max) {
        if (s == null) {
            return "";
        }
        return s.length() <= max ? s : s.substring(0, max) + "…";
    }

    private HttpHeaders authHeaders() {
        HttpHeaders h = new HttpHeaders();
        h.setBasicAuth(properties.getUsername(), properties.getApiToken(), StandardCharsets.UTF_8);
        return h;
    }

    private boolean credentialsOk() {
        return properties.getUsername() != null
                && !properties.getUsername().isBlank()
                && properties.getApiToken() != null
                && !properties.getApiToken().isBlank();
    }

    private String normalizedBaseUrl() {
        String b = properties.getBaseUrl();
        if (b == null) {
            return "";
        }
        return b.trim().replaceAll("/$", "");
    }

    private String resolveJobFullName(String pipelineKey) {
        if ("jenkinsfileTest".equals(pipelineKey)) {
            return properties.getMobileUi().getPipelineJenkinsfileTest();
        }
        return properties.getMobileUi().getPipelineJenkinsfile();
    }
}
