package com.klearity.guidance.domain;

import jakarta.persistence.*;
import lombok.*;

/**
 * Single-row settings table so the admin can edit the Klearity branding and contact
 * details without a code change.
 */
@Entity
@Table(name = "site_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiteSettings {

    @Id
    @Builder.Default
    private Long id = 1L;

    @Column(name = "company_name", nullable = false, length = 120)
    private String companyName;

    @Column(name = "tagline", length = 250)
    private String tagline;

    @Column(name = "about_text", length = 8000)
    private String aboutText;

    @Column(name = "contact_email", length = 190)
    private String contactEmail;

    @Column(name = "contact_phone", length = 40)
    private String contactPhone;

    @Column(name = "address", length = 400)
    private String address;

    @Column(name = "logo_path", length = 300)
    private String logoPath;
}
