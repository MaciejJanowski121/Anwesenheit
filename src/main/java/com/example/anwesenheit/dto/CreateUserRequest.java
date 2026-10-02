package com.example.anwesenheit.dto;

import com.example.anwesenheit.model.Role;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateUserRequest {

    private String username;

    private String password;

    private Role role;
}