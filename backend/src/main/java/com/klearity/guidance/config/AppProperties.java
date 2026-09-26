package com.klearity.guidance.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private Jwt jwt = new Jwt();
    private Mail mail = new Mail();
    private Cors cors = new Cors();

    @Getter
    @Setter
    public static class Jwt {
        private String secret;
        private long expirationMinutes = 720;
    }

    @Getter
    @Setter
    public static class Mail {
        private String fromName = "Klear And Klarity";
        private String fromAddress = "noreply@klearity.com";
        private String baseUrl = "http://localhost:5173";
        /**
         * Tri-state on purpose. "true" or "false" forces the behaviour; blank means auto,
         * which enforces email verification only once SMTP credentials are configured.
         */
        private String verificationRequired = "";
    }

    @Getter
    @Setter
    public static class Cors {
        private String allowedOrigins = "http://localhost:5173";
    }
}
