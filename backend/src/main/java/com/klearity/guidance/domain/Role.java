package com.klearity.guidance.domain;

/**
 * Application roles.
 *
 * EMPLOYEE is intentionally permission-free for now. It is registered and can log in,
 * but every admin-only endpoint is guarded by ADMIN only. When employee permissions are
 * decided later, add them here and in SecurityConfig (see ROLE_ADMIN checks) - nothing
 * else needs to change.
 */
public enum Role {
    STUDENT,
    EMPLOYEE,
    ADMIN
}
