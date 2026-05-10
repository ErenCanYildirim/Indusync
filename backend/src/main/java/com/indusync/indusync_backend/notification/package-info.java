/**
 * Shared module that contains components accessible by all other modules.
 * This module implicitly makes its defined named interfaces (e.g., "security", "exception")
 * available to other modules that declare a dependency on them.
 */
@ApplicationModule(displayName = "Notification")
package com.indusync.indusync_backend.notification;

import org.springframework.modulith.ApplicationModule;