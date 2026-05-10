/**
 * Shared module that contains components accessible by all other modules.
 * This module implicitly makes its defined named interfaces (e.g., "security", "exception")
 * available to other modules that declare a dependency on them.
 */
@ApplicationModule(displayName = "Shared", type = ApplicationModule.Type.OPEN)
package com.indusync.indusync_backend.shared;

import org.springframework.modulith.ApplicationModule;