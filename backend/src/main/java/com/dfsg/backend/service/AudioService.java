package com.dfsg.backend.service;

import com.dfsg.backend.model.GenerationLog;
import com.dfsg.backend.model.User;
import com.dfsg.backend.repository.GenerationLogRepository;
import com.dfsg.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.List;
import java.util.stream.Collectors;
import com.dfsg.backend.dto.GenerationLogDTO;

@Service
@RequiredArgsConstructor
public class AudioService {

    private final GenerationLogRepository logRepository;
    private final UserRepository userRepository;

    public byte[] generateClonedSpeech(String text, MultipartFile speakerWav) throws IOException {
        String username = ((UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getUsername();
        User user = userRepository.findByUsername(username).orElseThrow();

        // Prepare request to FastAPI
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("text", text);
        body.add("language", "en"); // Add language selection dynamically later if needed
        body.add("speaker_wav", new ByteArrayResource(speakerWav.getBytes()) {
            @Override
            public String getFilename() {
                return speakerWav.getOriginalFilename();
            }
        });

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        // Make HTTP Call to Python Microservice
        ResponseEntity<byte[]> response = restTemplate.postForEntity(
                "http://localhost:8001/generate/clone",
                requestEntity,
                byte[].class
        );

        byte[] audioBytes = response.getBody();

        if (audioBytes != null) {
            // Define storage path
            String outputFileName = "cloned_" + UUID.randomUUID() + ".wav";
            File directory = new File("generated_audio");
            if (!directory.exists()) directory.mkdirs();
            
            File outputFile = new File(directory, outputFileName);
            
            // Save file locally
            try (FileOutputStream fos = new FileOutputStream(outputFile)) {
                fos.write(audioBytes);
            }

            // Save log to DB
            GenerationLog log = GenerationLog.builder()
                    .user(user)
                    .textPrompt(text)
                    .voiceModel("XTTSv2")
                    .outputFilePath(outputFile.getAbsolutePath())
                    .createdAt(LocalDateTime.now())
                    .build();
            logRepository.save(log);
        }

        return audioBytes;
    }

    public List<GenerationLogDTO> getHistory() {
        String username = ((UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getUsername();
        User user = userRepository.findByUsername(username).orElseThrow();
        
        return logRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(log -> GenerationLogDTO.builder()
                        .id(log.getId())
                        .textPrompt(log.getTextPrompt())
                        .voiceModel(log.getVoiceModel())
                        .createdAt(log.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    public byte[] getAudioFile(Long id) throws IOException {
        String username = ((UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getUsername();
        User user = userRepository.findByUsername(username).orElseThrow();

        GenerationLog log = logRepository.findById(id).orElseThrow();
        if (!log.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized to access this audio file");
        }

        File file = new File(log.getOutputFilePath());
        if (!file.exists()) {
            throw new IOException("Audio file not found on server");
        }
        
        return Files.readAllBytes(file.toPath());
    }
}
