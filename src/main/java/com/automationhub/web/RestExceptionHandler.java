package com.automationhub.web;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestControllerAdvice
public class RestExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(RestExceptionHandler.class);

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", ex.getMessage() != null ? ex.getMessage() : "Bad request"));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> illegalState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(Map.of("error", ex.getMessage() != null ? ex.getMessage() : "Upstream error"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> validation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .orElse("Validation failed");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", msg));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> responseStatus(ResponseStatusException ex) {
        String reason = ex.getReason();
        return ResponseEntity.status(ex.getStatusCode())
                .body(Map.of("error", reason != null ? reason : "Request failed"));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, String>> dataAccess(DataAccessException ex) {
        String root = rootMessage(ex);
        if (isH2FileLock(root)) {
            log.warn("H2 database file is locked or exclusive: {}", root);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of(
                            "error",
                            "Database file is locked (another process is using ./data/qa-platform). "
                                    + "Stop every running copy of this app (IDE Run, Gradle bootRun, other terminals), "
                                    + "then start only one. If it still fails after all Java processes are stopped, "
                                    + "delete ./data/qa-platform.mv.db and related files and restart."));
        }
        log.error("Database access failed", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                        "error",
                        "Database error. Use only one app instance, or stop the other IDE/terminal process. "
                                + "If this persists, delete the ./data folder (H2 files) and restart."));
    }

    private static String rootMessage(Throwable ex) {
        Throwable t = ex;
        String last = ex.getMessage() != null ? ex.getMessage() : "";
        while (t.getCause() != null) {
            t = t.getCause();
            if (t.getMessage() != null) {
                last = t.getMessage();
            }
        }
        return last;
    }

    private static boolean isH2FileLock(String message) {
        if (message == null) {
            return false;
        }
        String m = message.toLowerCase();
        return m.contains("already in use")
                || m.contains("file is locked")
                || m.contains("90020")
                || m.contains("90098");
    }
}
