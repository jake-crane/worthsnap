package com.worthsnap.service.security;

import com.worthsnap.service.entity.User;
import com.worthsnap.service.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProvisioningService {

    private final UserRepository userRepository;

    public UserProvisioningService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public User upsert(String provider, String providerId, String email, String name, String avatarUrl) {
        User user = userRepository.findByProviderAndProviderId(provider, providerId).orElseGet(User::new);
        user.setProvider(provider);
        user.setProviderId(providerId);
        if (email != null) user.setEmail(email);
        if (name != null) user.setName(name);
        if (avatarUrl != null) user.setAvatarUrl(avatarUrl);
        return userRepository.save(user);
    }
}
