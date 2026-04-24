package com.automationhub.service;

import com.automationhub.config.JenkinsProperties;
import com.automationhub.web.dto.JenkinsLastBuildDto;
import com.automationhub.web.dto.JenkinsPipelineStatusDto;
import com.automationhub.web.dto.MobileUiJenkinsSummaryDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class JenkinsApiService {

    private static final String TREE =
            "building,duration,result,timestamp,url,number,fullDisplayName,actions[parameters[name,value,type]]";

    private final JenkinsProperties properties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public JenkinsApiService(JenkinsProperties properties, RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.properties = properties;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public MobileUiJenkinsSummaryDto mobileUiSummary() {
        String base = properties.getBaseUrl() != null ? properties.getBaseUrl().trim().replaceAll("/$", "") : "";
        boolean creds =
                properties.getUsername() != null
                        && !properties.getUsername().isBlank()
                        && properties.getApiToken() != null
                        && !properties.getApiToken().isBlank();

        JenkinsPipelineStatusDto primary =
                buildPipeline("jenkinsfile", "Jenkinsfile (cron / scheduled)", properties.getMobileUi().getPipelineJenkinsfile(), base, creds);
        JenkinsPipelineStatusDto test = buildPipeline(
                "jenkinsfileTest",
                "JenkinsfileTest (manual / suites)",
                properties.getMobileUi().getPipelineJenkinsfileTest(),
                base,
                creds);

        return new MobileUiJenkinsSummaryDto(base, creds, java.util.List.of(primary, test));
    }

    private JenkinsPipelineStatusDto buildPipeline(
            String key, String title, String jobFullName, String baseUrl, boolean credsConfigured) {
        if (jobFullName == null || jobFullName.isBlank()) {
            return new JenkinsPipelineStatusDto(key, title, "", "Job path not configured", null);
        }
        if (!credsConfigured) {
            return new JenkinsPipelineStatusDto(
                    key,
                    title,
                    jobFullName,
                    "Set JENKINS_USERNAME and JENKINS_API_TOKEN (or jenkins.username / jenkins.api-token) on the server.",
                    null);
        }
        if (baseUrl.isBlank()) {
            return new JenkinsPipelineStatusDto(key, title, jobFullName, "jenkins.base-url is empty", null);
        }
        try {
            String url = lastBuildApiUrl(baseUrl, jobFullName);
            HttpHeaders headers = new HttpHeaders();
            headers.setBasicAuth(properties.getUsername(), properties.getApiToken(), StandardCharsets.UTF_8);
            ResponseEntity<String> response =
                    restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            JenkinsLastBuildDto build = parseLastBuild(root);
            return new JenkinsPipelineStatusDto(key, title, jobFullName, null, build);
        } catch (HttpStatusCodeException e) {
            String hint = e.getStatusCode().value() == 404
                    ? "Job not found — check jenkins.mobile-ui pipeline paths match the controller."
                    : e.getStatusCode().toString();
            return new JenkinsPipelineStatusDto(key, title, jobFullName, "Jenkins API: " + hint, null);
        } catch (Exception e) {
            return new JenkinsPipelineStatusDto(key, title, jobFullName, e.getMessage(), null);
        }
    }

    String lastBuildApiUrl(String baseUrl, String jobFullName) {
        String jobPath = jobFullNameToPath(jobFullName);
        return apiJsonUrlWithTree(baseUrl + jobPath + "lastBuild/api/json", TREE);
    }

    /**
     * Jenkins {@code tree} query values use {@code […]}; Spring 6 {@code UriComponentsBuilder.build(true)} rejects
     * unencoded brackets in query parameters — encode explicitly.
     */
    static String apiJsonUrlWithTree(String apiJsonUrlWithoutQuery, String treeSpec) {
        if (apiJsonUrlWithoutQuery.contains("?")) {
            throw new IllegalArgumentException("Expected URL without query string");
        }
        return apiJsonUrlWithoutQuery
                + "?tree="
                + URLEncoder.encode(treeSpec, StandardCharsets.UTF_8).replace("+", "%20");
    }

    /** {@code QA_related/UI_Automation/Foo} → {@code /job/QA_related/job/UI_Automation/job/Foo/} */
    static String jobFullNameToPath(String jobFullName) {
        String[] parts = jobFullName.split("/");
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (part.isEmpty()) {
                continue;
            }
            sb.append("/job/");
            sb.append(encodeSegment(part));
        }
        sb.append("/");
        return sb.toString();
    }

    private static String encodeSegment(String segment) {
        return URLEncoder.encode(segment, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private JenkinsLastBuildDto parseLastBuild(JsonNode root) {
        int number = root.path("number").asInt(0);
        String result = Optional.ofNullable(root.get("result")).map(JsonNode::asText).orElse("");
        boolean building = root.path("building").asBoolean(false);
        long timestamp = root.path("timestamp").asLong(0L);
        long duration = root.path("duration").asLong(0L);
        String url = Optional.ofNullable(root.get("url")).map(JsonNode::asText).orElse("");
        Map<String, String> params = parseActionsParameters(root.path("actions"));
        return JenkinsLastBuildDto.of(number, result, building, timestamp, duration, url, params);
    }

    /** Shared with {@link JenkinsMobileUiTriggerService} for build {@code actions} parsing. */
    public static Map<String, String> parseActionsParameters(JsonNode actions) {
        Map<String, String> out = new LinkedHashMap<>();
        if (!actions.isArray()) {
            return out;
        }
        for (JsonNode action : actions) {
            JsonNode parameters = action.get("parameters");
            if (parameters == null || !parameters.isArray()) {
                continue;
            }
            for (JsonNode p : parameters) {
                String name = p.path("name").asText("");
                if (name.isEmpty()) {
                    continue;
                }
                JsonNode value = p.get("value");
                String str;
                if (value == null || value.isNull()) {
                    str = "";
                } else if (value.isTextual()) {
                    str = value.asText();
                } else if (value.isNumber()) {
                    str = value.asText();
                } else if (value.isBoolean()) {
                    str = Boolean.toString(value.booleanValue());
                } else {
                    str = value.toString();
                }
                out.put(name, str);
            }
        }
        return out;
    }
}
