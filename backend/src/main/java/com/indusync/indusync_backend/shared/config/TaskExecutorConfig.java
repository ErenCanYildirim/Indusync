package com.indusync.indusync_backend.shared.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskExecutor;
import org.springframework.core.task.VirtualThreadTaskExecutor;


@Configuration
public class TaskExecutorConfig {

    @Bean("fileUploadTaskExecutor")
    public TaskExecutor fileUploadTaskExecutor() {
        return new VirtualThreadTaskExecutor("FileUpload-");
    }
}