package com.leafshop.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.leafshop.auth.JwtUtil;
import com.leafshop.dto.auth.AuthResponse;
import com.leafshop.dto.auth.LoginRequest;
import com.leafshop.dto.auth.RegisterRequest;
import com.leafshop.model.dynamodb.UserTable;
import com.leafshop.repository.UserTableRepository;
import com.leafshop.service.AuthService;
import com.leafshop.service.PasswordResetService;
import com.leafshop.service.RefreshTokenService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private PasswordResetService passwordResetService;

    @MockBean
    private RefreshTokenService refreshTokenService;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private UserTableRepository userTableRepository;

    @Test
    public void registerReturnsAuthResponse() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setFirstName("Test");
        req.setLastName("User");
        req.setPhoneNumber("0123456789");
        req.setEmail("t@example.com");
        req.setUsername("testuser");
        req.setPassword("Pass123!");

        AuthResponse resp = new AuthResponse("access-token", "Bearer", "refresh-token", 12345L);
        Mockito.when(authService.register(any(RegisterRequest.class))).thenReturn(resp);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").value("access-token"))
            .andExpect(jsonPath("$.refreshToken").value("refresh-token"));
    }

    @Test
    public void loginReturnsAuthResponse() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername("testuser");
        req.setPassword("Pass123!");

        AuthResponse resp = new AuthResponse("access-token", "Bearer", "refresh-token", 12345L);
        Mockito.when(authService.login(any(LoginRequest.class))).thenReturn(resp);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").value("access-token"))
            .andExpect(jsonPath("$.refreshToken").value("refresh-token"));
    }

    @Test
    public void refreshRotatesToken() throws Exception {
        String oldRefresh = "old-refresh";
        UserTable token = UserTable.builder().pk("USER#1").sk("TOKEN#1").itemType("TOKEN").tokenValue(oldRefresh).tokenType("REFRESH_TOKEN").expiresAt(System.currentTimeMillis() + 10000).build();
        Mockito.when(refreshTokenService.findByValue(eq(oldRefresh))).thenReturn(Optional.of(token));

        UserTable newToken = UserTable.builder().pk("USER#1").sk("TOKEN#2").itemType("TOKEN").tokenValue("new-refresh").tokenType("REFRESH_TOKEN").expiresAt(System.currentTimeMillis() + 999999).build();
        Mockito.when(refreshTokenService.rotateToken(Mockito.eq(token), Mockito.anyLong())).thenReturn(Optional.of(newToken));

        UserTable account = UserTable.builder().pk("USER#1").sk("ACCOUNT").username("testuser").build();
        Mockito.when(userTableRepository.findByPkAndSk(token.getPk(), "ACCOUNT")).thenReturn(Optional.of(account));
        Mockito.when(jwtUtil.generateToken("testuser")).thenReturn("new-access");

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("\"" + oldRefresh + "\""))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").value("new-access"))
            .andExpect(jsonPath("$.refreshToken").value("new-refresh"));
    }
}
