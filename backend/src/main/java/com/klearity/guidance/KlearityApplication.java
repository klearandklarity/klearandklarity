package com.klearity.guidance;

import io.github.cdimascio.dotenv.Dotenv;
import io.github.cdimascio.dotenv.DotenvEntry;
import io.github.cdimascio.dotenv.DotenvException;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

@SpringBootApplication
@ConfigurationPropertiesScan
public class KlearityApplication {

    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(KlearityApplication.class, args);
    }

    /**
     * Lets you keep secrets in a .env file next to the project instead of exporting them in
     * every terminal. Real environment variables always win, so hosting platforms that inject
     * env vars are unaffected. A missing .env is not an error.
     *
     * Both backend\.env and a .env in the parent folder are picked up, so the file can live
     * wherever it is most convenient. The first one found wins.
     *
     * Values are pushed in as system properties because Spring resolves ${...} placeholders
     * against the whole Environment, which includes system properties.
     */
    private static void loadDotEnv() {
        String workingDir = System.getProperty("user.dir");
        Path parent = Path.of(workingDir).toAbsolutePath().getParent();

        List<Path> candidates = new ArrayList<>();
        candidates.add(Path.of(workingDir));
        if (parent != null) {
            candidates.add(parent);
        }

        for (Path directory : candidates) {
            try {
                Dotenv dotenv = Dotenv.configure()
                        .directory(directory.toString())
                        .ignoreIfMissing()
                        .ignoreIfMalformed()
                        .load();

                for (DotenvEntry entry : dotenv.entries()) {
                    String key = entry.getKey();
                    if (System.getenv(key) == null && System.getProperty(key) == null) {
                        System.setProperty(key, entry.getValue());
                    }
                }
                System.out.println("Loaded .env from " + directory.toAbsolutePath());
                return;
            } catch (DotenvException e) {
                // No .env in this directory, try the next candidate.
            }
        }

        System.out.println("No .env file found. Using real environment variables only.");
    }
}
