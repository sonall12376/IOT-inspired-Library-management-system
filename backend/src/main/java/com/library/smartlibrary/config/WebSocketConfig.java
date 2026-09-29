package com.library.smartlibrary.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@SuppressWarnings("null")
public class WebSocketConfig implements WebSocketConfigurer {

    private final WebSocketRoomHandler webSocketRoomHandler;

    public WebSocketConfig(WebSocketRoomHandler webSocketRoomHandler) {
        this.webSocketRoomHandler = webSocketRoomHandler;
    }

    @Override
    public void registerWebSocketHandlers(@org.springframework.lang.NonNull WebSocketHandlerRegistry registry) {
        registry.addHandler(webSocketRoomHandler, "/socket")
                .setAllowedOrigins("*");
    }
}
