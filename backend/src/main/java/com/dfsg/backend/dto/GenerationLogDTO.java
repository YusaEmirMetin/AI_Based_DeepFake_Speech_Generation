package com.dfsg.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GenerationLogDTO {
    private Long id;
    private String textPrompt;
    private String voiceModel;
    private LocalDateTime createdAt;
}
