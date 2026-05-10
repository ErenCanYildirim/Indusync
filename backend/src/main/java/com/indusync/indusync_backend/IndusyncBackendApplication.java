package com.indusync.indusync_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.modulith.Modulith;
import org.springframework.scheduling.annotation.EnableAsync;

import static org.springframework.data.web.config.EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO;

@SpringBootApplication
@Modulith(sharedModules = "shared")
@EnableAsync
@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)
public class IndusyncBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(IndusyncBackendApplication.class, args);
	}

}