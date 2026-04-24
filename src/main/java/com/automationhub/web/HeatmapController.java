package com.automationhub.web;

import com.automationhub.reporting.HeatmapService;
import com.automationhub.web.dto.HeatmapCellResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/heatmap")
public class HeatmapController {

    private final HeatmapService heatmapService;

    public HeatmapController(HeatmapService heatmapService) {
        this.heatmapService = heatmapService;
    }

    @GetMapping
    public List<HeatmapCellResponse> heatmap() {
        return heatmapService.buildHeatmap();
    }
}
