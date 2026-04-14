package com.dfsg.backend.controller;

import com.dfsg.backend.service.AudioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/audio")
@RequiredArgsConstructor
public class AudioController {

    private final AudioService audioService;

    @PostMapping("/generate")
    public ResponseEntity<byte[]> generateAudio(
            @RequestParam("text") String text,
            @RequestParam("speakerWav") MultipartFile speakerWav
    ) {
        try {
            byte[] aiGeneratedAudio = audioService.generateClonedSpeech(text, speakerWav);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.valueOf("audio/wav"));
            headers.setContentDispositionFormData("attachment", "generated_speech.wav");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(aiGeneratedAudio);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory() {
        try {
            return ResponseEntity.ok(audioService.getHistory());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<byte[]> downloadAudio(@PathVariable Long id) {
        try {
            byte[] fileBytes = audioService.getAudioFile(id);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.valueOf("audio/wav"));
            headers.setContentDispositionFormData("attachment", "history_" + id + ".wav");
            return ResponseEntity.ok().headers(headers).body(fileBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
