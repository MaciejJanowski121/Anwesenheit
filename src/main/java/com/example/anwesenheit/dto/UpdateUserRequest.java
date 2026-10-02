package com.example.anwesenheit.dto;

import com.example.anwesenheit.model.Role;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateUserRequest {

    private String username;

    private Role role;

    private Boolean enabled;
}