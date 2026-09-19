package com.worthsnap.service.security;

import com.worthsnap.service.entity.User;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

/**
 * Handles OIDC-compliant providers (currently just Google). GitHub is plain OAuth2, not OIDC,
 * and is handled separately by {@link CustomOAuth2UserService}.
 */
@Service
public class CustomOidcUserService extends OidcUserService {

    private final UserProvisioningService provisioningService;

    public CustomOidcUserService(UserProvisioningService provisioningService) {
        this.provisioningService = provisioningService;
    }

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);
        String provider = userRequest.getClientRegistration().getRegistrationId();
        String providerId = oidcUser.getSubject();
        String email = oidcUser.getEmail() != null ? oidcUser.getEmail() : oidcUser.getPreferredUsername();
        String name = oidcUser.getFullName();
        String avatarUrl = oidcUser.getPicture();

        User user = provisioningService.upsert(provider, providerId, email, name, avatarUrl);
        return new AppOidcUser(oidcUser, user.getId());
    }
}
