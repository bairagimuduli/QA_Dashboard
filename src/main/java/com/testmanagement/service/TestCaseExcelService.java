package com.testmanagement.service;

import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class TestCaseExcelService {

    private static final DataFormatter CELL_FORMAT = new DataFormatter();

    /** Longest-first for contains() matching to avoid false positives */
    public static final String[] TITLE_HEADERS = {
        "test case title", "test case", "summary", "title", "tc name", "name"
    };
    public static final String[] STEPS_HEADERS = {"test steps", "steps to reproduce", "steps", "procedure", "actions"};
    public static final String[] EXPECTED_HEADERS = {"expected result", "expected outcome", "expected", "result"};
    public static final String[] PRIORITY_HEADERS = {"priority", "severity", "prio"};

    public List<ParsedTestCaseRow> parse(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file uploaded");
        }
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase(Locale.ROOT) : "";
        if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only .xlsx or .xls Excel files are supported");
        }
        try (InputStream in = file.getInputStream(); Workbook wb = WorkbookFactory.create(in)) {
            Sheet sheet = wb.getSheetAt(0);
            if (sheet == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Workbook has no sheets");
            }
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "First row must contain column headers");
            }
            Integer titleCol = findColumn(headerRow, TITLE_HEADERS);
            if (titleCol == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Could not find a Title column. Add a column named Title, Test case, or Name in row 1.");
            }
            Integer stepsCol = findColumn(headerRow, STEPS_HEADERS);
            Integer expectedCol = findColumn(headerRow, EXPECTED_HEADERS);
            Integer priorityCol = findColumn(headerRow, PRIORITY_HEADERS);

            List<ParsedTestCaseRow> rows = new ArrayList<>();
            int lastRow = sheet.getLastRowNum();
            for (int r = 1; r <= lastRow; r++) {
                Row row = sheet.getRow(r);
                if (row == null) {
                    continue;
                }
                String title = cellString(row.getCell(titleCol)).trim();
                if (title.isEmpty()) {
                    continue;
                }
                String steps = stepsCol != null ? cellString(row.getCell(stepsCol)).trim() : "";
                String expected = expectedCol != null ? cellString(row.getCell(expectedCol)).trim() : "";
                String priority = priorityCol != null ? normalizePriority(cellString(row.getCell(priorityCol))) : "MEDIUM";
                rows.add(new ParsedTestCaseRow(title, emptyToNull(steps), emptyToNull(expected), priority));
            }
            if (rows.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No data rows with a Title were found below the header row");
            }
            return rows;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read Excel file: " + e.getMessage());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Excel file: " + e.getMessage());
        }
    }

    public byte[] buildTemplate() {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Test cases");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Title");
            header.createCell(1).setCellValue("Steps");
            header.createCell(2).setCellValue("Expected result");
            header.createCell(3).setCellValue("Priority");
            Row example = sheet.createRow(1);
            example.createCell(0).setCellValue("Login with valid user");
            example.createCell(1).setCellValue("1. Open login page\n2. Enter credentials\n3. Submit");
            example.createCell(2).setCellValue("User lands on home page");
            example.createCell(3).setCellValue("HIGH");
            sheet.setColumnWidth(0, 8000);
            sheet.setColumnWidth(1, 12000);
            sheet.setColumnWidth(2, 10000);
            sheet.setColumnWidth(3, 4000);
            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not build template");
        }
    }

    private static String emptyToNull(String s) {
        return s == null || s.isEmpty() ? null : s;
    }

    private static String normalizePriority(String raw) {
        if (raw == null || raw.isEmpty()) {
            return "MEDIUM";
        }
        String u = raw.trim().toUpperCase(Locale.ROOT);
        if (u.startsWith("L")) {
            return "LOW";
        }
        if (u.startsWith("H")) {
            return "HIGH";
        }
        if (u.startsWith("M") || u.equals("P2") || u.equals("P3")) {
            return "MEDIUM";
        }
        if (u.equals("P0") || u.equals("P1") || u.equals("CRITICAL")) {
            return "HIGH";
        }
        return "MEDIUM";
    }

    private static Integer findColumn(Row headerRow, String... keywords) {
        short last = headerRow.getLastCellNum();
        String[] sorted = Arrays.copyOf(keywords, keywords.length);
        Arrays.sort(sorted, Comparator.comparingInt(String::length).reversed());
        for (int c = 0; c < last; c++) {
            String h = cellString(headerRow.getCell(c)).toLowerCase(Locale.ROOT).trim();
            if (h.isEmpty()) {
                continue;
            }
            for (String kw : sorted) {
                if (h.equals(kw)) {
                    return c;
                }
            }
        }
        for (int c = 0; c < last; c++) {
            String h = cellString(headerRow.getCell(c)).toLowerCase(Locale.ROOT).trim();
            if (h.isEmpty()) {
                continue;
            }
            for (String kw : sorted) {
                if (kw.length() >= 6 && h.contains(kw)) {
                    return c;
                }
                if (kw.length() < 6 && h.equals(kw)) {
                    return c;
                }
            }
        }
        return null;
    }

    private static String cellString(org.apache.poi.ss.usermodel.Cell cell) {
        if (cell == null) {
            return "";
        }
        return CELL_FORMAT.formatCellValue(cell);
    }

    public record ParsedTestCaseRow(String title, String steps, String expectedResult, String priority) {}
}
