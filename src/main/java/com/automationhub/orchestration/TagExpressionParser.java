package com.automationhub.orchestration;

import com.automationhub.domain.TestScope;
import com.automationhub.domain.TestSuite;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Tag-based filtering. Extend to full boolean grammar (AND/OR/NOT) as tests adopt conventions.
 */
@Component
public class TagExpressionParser {

    public boolean matches(TestSuite suite, TestScope scope, String tagExpression) {
        Set<String> tags = suite.getTags().stream()
                .map(t -> t.toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());
        if (tagExpression != null && !tagExpression.isBlank()) {
            return evaluateSimpleExpression(tags, tagExpression);
        }
        return matchesScopeDefault(tags, scope);
    }

    private boolean matchesScopeDefault(Set<String> tags, TestScope scope) {
        return switch (scope) {
            case FULL -> true;
            case SMOKE -> tags.contains("smoke");
            case SANITY -> tags.contains("sanity");
            case REGRESSION -> tags.contains("regression");
        };
    }

    /**
     * Supports AND-chained clauses: {@code @smoke AND NOT @flaky AND @pod:onboarding}
     * Tokens are case-insensitive; leading @ is optional on positive clauses.
     */
    private boolean evaluateSimpleExpression(Set<String> tags, String expression) {
        String[] parts = expression.split("(?i)\\s+AND\\s+");
        for (String raw : parts) {
            String part = raw.trim();
            if (part.isEmpty()) {
                continue;
            }
            boolean neg = part.toUpperCase(Locale.ROOT).startsWith("NOT ");
            String token = neg ? part.substring(4).trim() : part;
            token = token.startsWith("@") ? token.substring(1) : token;
            token = token.toLowerCase(Locale.ROOT);
            boolean has = tags.contains(token);
            if (neg) {
                if (has) {
                    return false;
                }
            } else if (!has) {
                return false;
            }
        }
        return true;
    }

    /** For wizard search bar: split comma-separated tags */
    public Set<String> parseCsvTags(String csv) {
        if (csv == null || csv.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> s.startsWith("@") ? s.substring(1).toLowerCase(Locale.ROOT) : s.toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());
    }
}
