package com.worthsnap.service.security;

import java.util.Collection;
import java.util.Map;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

public class AppOAuth2User implements OAuth2User, AppPrincipal {

    private final OAuth2User delegate;
    private final Long userId;

    public AppOAuth2User(OAuth2User delegate, Long userId) {
        this.delegate = delegate;
        this.userId = userId;
    }

    @Override
    public Long getUserId() {
        return userId;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return delegate.getAttributes();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return delegate.getAuthorities();
    }

    @Override
    public String getName() {
        return delegate.getName();
    }
}
