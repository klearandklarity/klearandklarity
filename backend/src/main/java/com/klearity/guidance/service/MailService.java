package com.klearity.guidance.service;

import com.klearity.guidance.config.AppProperties;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Sends the verification and password-reset emails through Gmail SMTP.
 *
 * SMTP is optional: when no username/password is configured the app keeps working and the
 * link is written to the log instead, so local development never dead-ends.
 *
 * Credentials are read from the Spring Environment, which covers real environment variables,
 * system properties and a local .env file (loaded in KlearityApplication).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {

    private final JavaMailSender mailSender;
    private final AppProperties props;
    private final Environment env;

    /** True when a Gmail username and app password are present. */
    public boolean isConfigured() {
        return isPresent(username()) && isPresent(password());
    }

    /**
     * Reads spring.mail.* rather than the raw variable name, because those properties are
     * declared as ${MAIL_USERNAME:}/${MAIL_PASSWORD:} in application.yml. Resolving through
     * Spring means a real environment variable, a system property and a .env entry all work.
     */
    private String username() {
        return env.getProperty("spring.mail.username");
    }

    private String password() {
        return env.getProperty("spring.mail.password");
    }

    private boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }

    private String fromAddress() {
        String value = env.getProperty("app.mail.from-address");
        return isPresent(value) ? value : props.getMail().getFromAddress();
    }

    private String fromName() {
        String value = env.getProperty("app.mail.from-name");
        return isPresent(value) ? value : props.getMail().getFromName();
    }

    /**
     * @return true when the mail was really handed to the SMTP server, false when SMTP is
     * not configured (the link is then logged instead).
     */
    public boolean send(String to, String subject, String htmlBody) {
        String from = fromAddress();
        String user = username();
        String secret = password();

        // A half-configured SMTP (username without password, or the reverse) cannot
        // authenticate, so treat it as not configured instead of throwing on every send.
        if (!isPresent(user) || !isPresent(secret)) {
            log.warn("SMTP not configured (MAIL_USERNAME / MAIL_PASSWORD missing) - "
                    + "email not sent to {}.", to);
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from, fromName());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Sent '{}' email to {}", subject, to);
            return true;
        } catch (MailException | jakarta.mail.MessagingException
                 | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send '{}' email to {}: {}", subject, to, e.getMessage());
            return false;
        }
    }

    public String verificationLink(String token) {
        return props.getMail().getBaseUrl() + "/verify-email?token=" + token;
    }

    public String resetLink(String token) {
        return props.getMail().getBaseUrl() + "/reset-password?token=" + token;
    }

    public String verificationEmail(String name, String link) {
        return layout("Verify your " + fromName() + " account",
                "<p>Hi " + esc(name) + ",</p>"
                        + "<p>Thanks for registering. Confirm your email address to activate your account, "
                        + "then sign in.</p>"
                        + button(link, "Verify my email")
                        + "<p style=\"color:#64748b;font-size:13px\">This link expires in 24 hours. "
                        + "If you did not register, you can ignore this email.</p>");
    }

    public String resetEmail(String name, String link) {
        return layout("Reset your " + fromName() + " password",
                "<p>Hi " + esc(name) + ",</p>"
                        + "<p>We received a request to reset your password. Choose a new one using the button below.</p>"
                        + button(link, "Reset my password")
                        + "<p style=\"color:#64748b;font-size:13px\">This link expires in 60 minutes. "
                        + "If you did not ask for this, your password stays unchanged.</p>");
    }

    private String button(String link, String label) {
        return "<p style=\"margin:28px 0\"><a href=\"" + link + "\" "
                + "style=\"background:#1d4ed8;color:#ffffff;padding:12px 22px;border-radius:10px;"
                + "text-decoration:none;font-weight:600;display:inline-block\">" + label + "</a></p>"
                + "<p style=\"font-size:12px;color:#94a3b8;word-break:break-all\">If the button does not work, "
                + "copy this link: " + link + "</p>";
    }

    private String layout(String title, String body) {
        return "<div style=\"font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;"
                + "background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px\">"
                + "<h2 style=\"margin:0 0 16px;color:#0f172a;font-size:20px\">" + title + "</h2>"
                + "<div style=\"color:#334155;font-size:15px;line-height:1.6\">" + body + "</div>"
                + "<hr style=\"border:none;border-top:1px solid #e2e8f0;margin:28px 0 16px\">"
                + "<p style=\"color:#94a3b8;font-size:12px;margin:0\">"
                + fromName() + " &middot; Career guidance for students. Please do not reply to this email.</p>"
                + "</div>";
    }

    private String esc(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
