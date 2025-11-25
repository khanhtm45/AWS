package com.leafshop.auth;

import com.leafshop.model.dynamodb.UserTable;
import com.leafshop.repository.UserTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DynamoUserDetailsService implements UserDetailsService {

    private final UserTableRepository userTableRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Optional<UserTable> accountOpt = userTableRepository.findAccountByUsername(username);
        UserTable account = accountOpt.orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        return new org.springframework.security.core.userdetails.User(
            account.getUsername(),
            account.getPassword(),
            account.getIsActive() != null ? account.getIsActive() : true,
            true, true, true,
            toAuthorities(account.getRole())
        );
    }

    private Collection<? extends GrantedAuthority> toAuthorities(String role) {
        if (role == null) return List.of();
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));
    }
}
