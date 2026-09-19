package com.worthsnap.service.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            CustomOidcUserService customOidcUserService,
            CustomOAuth2UserService customOAuth2UserService,
            @Value("${app.base-url}") String appBaseUrl)
            throws Exception {
        http.csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
                .addFilterAfter(new CsrfCookieFilter(), BasicAuthenticationFilter.class)
                .authorizeHttpRequests(auth -> auth.requestMatchers("/api/me")
                        .permitAll()
                        .requestMatchers("/api/**")
                        .authenticated()
                        .anyRequest()
                        .permitAll())
                .exceptionHandling(ex -> ex.defaultAuthenticationEntryPointFor(
                        new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                        PathPatternRequestMatcher.pathPattern("/api/**")))
                .oauth2Login(oauth2 -> oauth2.userInfoEndpoint(userInfo -> userInfo.oidcUserService(customOidcUserService)
                                .userService(customOAuth2UserService))
                        // Explicit absolute URL, not a relative "/": Tomcat resolves a relative
                        // defaultSuccessUrl into an absolute Location header itself, using the Host
                        // header it received - which the Vite dev proxy rewrites to the backend's own
                        // address (changeOrigin: true), producing a redirect to :8081 instead of the
                        // browser's actual :5173 origin.
                        .defaultSuccessUrl(appBaseUrl + "/", true))
                .logout(logout -> logout.logoutUrl("/logout")
                        .logoutSuccessUrl(appBaseUrl + "/")
                        .deleteCookies("JSESSIONID"));
        return http.build();
    }
}
