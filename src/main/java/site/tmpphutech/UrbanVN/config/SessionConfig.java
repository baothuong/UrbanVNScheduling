package site.tmpphutech.UrbanVN.config;


import jakarta.servlet.ServletContext;
import jakarta.servlet.ServletException;
import jakarta.servlet.SessionCookieConfig;
import org.springframework.boot.web.servlet.ServletContextInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SessionConfig {
    @Bean
    public ServletContextInitializer servletContextInitializer() {
        return new ServletContextInitializer() {
            @Override
            public void onStartup(ServletContext servletContext) throws ServletException {
                // Cấu hình session cookie
                SessionCookieConfig sessionCookieConfig = servletContext.getSessionCookieConfig();
                sessionCookieConfig.setName("JSESSIONID");
                sessionCookieConfig.setHttpOnly(true);
                sessionCookieConfig.setSecure(false); // false cho development
                sessionCookieConfig.setPath("/");
                sessionCookieConfig.setMaxAge(1800); // 30 phút

                // Cấu hình session timeout
                servletContext.setSessionTimeout(30); // 30 phút
                System.out.println("=== SESSION CONFIG INITIALIZED ===");
                System.out.println("Cookie Name: " + sessionCookieConfig.getName());
                System.out.println("HttpOnly: " + sessionCookieConfig.isHttpOnly());
                System.out.println("Max Age: " + sessionCookieConfig.getMaxAge());
            }
        };
    }
}
