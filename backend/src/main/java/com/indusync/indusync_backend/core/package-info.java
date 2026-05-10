/**
 * Core module that contains shared utilities and configurations.
 * This module provides named interfaces including "security" that can be used
 * by other modules.
 */

@org.springframework.modulith.ApplicationModule(allowedDependencies = { "shared" })
package com.indusync.indusync_backend.core;