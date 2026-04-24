package com.testmanagement.domain;

public enum FeatureStatus {
    /** QA is drafting test cases */
    DRAFT,
    /** Submitted for product review; product team was notified */
    PENDING_PRODUCT_REVIEW,
    /** Product approved; automation team was notified */
    APPROVED_FOR_AUTOMATION
}
