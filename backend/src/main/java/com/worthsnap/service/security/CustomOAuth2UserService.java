package com.worthsnap.service.security;

import com.worthsnap.service.entity.User;
import java.util.Map;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

/** Handles plain OAuth2 providers. Only GitHub, today. */
@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserProvisioningService provisioningService;

    public CustomOAuth2UserService(UserProvisioningService provisioningService) {
        this.provisioningService = provisioningService;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        String provider = userRequest.getClientRegistration().getRegistrationId();
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String providerId = String.valueOf(attributes.get("id"));
        String email = (String) attributes.get("email");
        Object name = attributes.get("name");
        String resolvedName = name != null ? name.toString() : (String) attributes.get("login");
        String avatarUrl = (String) attributes.get("avatar_url");

        User user = provisioningService.upsert(provider, providerId, email, resolvedName, avatarUrl);
        return new AppOAuth2User(oAuth2User, user.getId());
    }
}
