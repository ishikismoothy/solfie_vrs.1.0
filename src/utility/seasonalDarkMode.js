// src/utils/seasonalDarkMode.js
// Seasonal Dark Mode Utility Module

/**
 * Configuration for seasonal dark mode
 * Modify these settings based on your location and preferences
 */
export const SEASONAL_CONFIG = {
  // Set your hemisphere: 'north' or 'south'
  hemisphere: 'north',
  
  // Enable/disable seasonal adjustments
  enabled: true,
  
  // Allow manual override
  allowOverride: true,
  overrideDuration: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
  
  // Seasonal definitions with smooth transitions
  seasons: {
    winter: {
      startMonth: 11,  // December
      peakMonth: 0,    // January (darkest)
      endMonth: 1,     // February
      darkStart: 16.5, // 4:30 PM
      darkEnd: 7.5     // 7:30 AM
    },
    spring: {
      startMonth: 2,   // March
      peakMonth: 3,    // April
      endMonth: 4,     // May
      darkStart: 19,   // 7:00 PM
      darkEnd: 6       // 6:00 AM
    },
    summer: {
      startMonth: 5,   // June
      peakMonth: 6,    // July (brightest)
      endMonth: 7,     // August
      darkStart: 21,   // 9:00 PM
      darkEnd: 5       // 5:00 AM
    },
    autumn: {
      startMonth: 8,   // September
      peakMonth: 9,    // October
      endMonth: 10,    // November
      darkStart: 18,   // 6:00 PM
      darkEnd: 6.5     // 6:30 AM
    }
  }
};

/**
 * Smooth interpolation between two values using cosine
 * @param {number} current - Current value
 * @param {number} next - Next value
 * @param {number} progress - Progress between 0 and 1
 * @returns {number} Interpolated value
 */
const cosineInterpolate = (current, next, progress) => {
  const cosineProgress = (1 - Math.cos(progress * Math.PI)) / 2;
  return current + (next - current) * cosineProgress;
};

/**
 * Get the current season based on month
 * @param {number} month - Month (0-11)
 * @returns {Object} Current season configuration
 */
const getCurrentSeason = (month) => {
  const seasons = Object.values(SEASONAL_CONFIG.seasons);
  
  for (const season of seasons) {
    // Handle seasons that span year boundary
    if (season.startMonth > season.endMonth) {
      if (month >= season.startMonth || month <= season.endMonth) {
        return season;
      }
    } else {
      if (month >= season.startMonth && month <= season.endMonth) {
        return season;
      }
    }
  }
  
  // Default fallback (shouldn't happen)
  return seasons[0];
};

/**
 * Calculate seasonal dark mode hours with smooth transitions
 * @param {Date} date - Date to calculate for (defaults to now)
 * @returns {Object} Object with start and end hours
 */
export const getSeasonalHours = (date = new Date()) => {
  // If seasonal mode is disabled, return default hours
  if (!SEASONAL_CONFIG.enabled) {
    return { start: 18, end: 6 };
  }
  
  const month = date.getMonth();
  const day = date.getDate();
  const daysInMonth = new Date(date.getFullYear(), month + 1, 0).getDate();
  const monthProgress = day / daysInMonth;
  
  // Adjust for hemisphere
  const adjustedMonth = SEASONAL_CONFIG.hemisphere === 'south' 
    ? (month + 6) % 12 
    : month;
  
  const currentSeason = getCurrentSeason(adjustedMonth);
  const seasons = Object.values(SEASONAL_CONFIG.seasons);
  const currentIndex = seasons.indexOf(currentSeason);
  const nextSeason = seasons[(currentIndex + 1) % seasons.length];
  
  // Calculate transition progress
  let transitionProgress = 0;
  
  if (adjustedMonth === currentSeason.endMonth) {
    // Last month of season - smooth transition
    transitionProgress = monthProgress * 0.5;
  } else if (adjustedMonth === currentSeason.peakMonth) {
    // Peak month - no transition
    transitionProgress = 0;
  } else {
    // Calculate distance from peak for slight adjustments
    const monthsFromPeak = Math.min(
      Math.abs(adjustedMonth - currentSeason.peakMonth),
      Math.abs((adjustedMonth + 12) - currentSeason.peakMonth) % 12
    );
    transitionProgress = monthsFromPeak > 2 ? 0.25 : 0.1;
  }
  
  // Apply interpolation if transitioning
  if (transitionProgress > 0 && nextSeason) {
    return {
      start: cosineInterpolate(currentSeason.darkStart, nextSeason.darkStart, transitionProgress),
      end: cosineInterpolate(currentSeason.darkEnd, nextSeason.darkEnd, transitionProgress)
    };
  }
  
  return {
    start: currentSeason.darkStart,
    end: currentSeason.darkEnd
  };
};

/**
 * Check if current time should be in dark mode
 * @param {Date} date - Date to check (defaults to now)
 * @returns {boolean} True if dark mode should be active
 */
export const shouldBeDarkMode = (date = new Date()) => {
  // Check for user override first
  if (SEASONAL_CONFIG.allowOverride) {
    const override = localStorage.getItem('darkModeOverride');
    const overrideExpiry = localStorage.getItem('darkModeOverrideExpiry');
    
    if (override && overrideExpiry) {
      const expiryTime = parseInt(overrideExpiry);
      if (Date.now() < expiryTime) {
        return override === 'true';
      } else {
        // Clear expired override
        localStorage.removeItem('darkModeOverride');
        localStorage.removeItem('darkModeOverrideExpiry');
      }
    }
  }
  
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const currentTime = hours + (minutes / 60);
  
  const { start, end } = getSeasonalHours(date);
  
  // Handle dark mode spanning midnight
  if (start > end) {
    return currentTime >= start || currentTime < end;
  } else {
    return currentTime >= start && currentTime < end;
  }
};

/**
 * Toggle dark mode override
 * @param {boolean} forcedValue - Optional forced value
 * @returns {boolean} New dark mode state
 */
export const toggleDarkModeOverride = (forcedValue = null) => {
  if (!SEASONAL_CONFIG.allowOverride) {
    return shouldBeDarkMode();
  }
  
  const currentValue = shouldBeDarkMode();
  const newValue = forcedValue !== null ? forcedValue : !currentValue;
  
  localStorage.setItem('darkModeOverride', newValue.toString());
  localStorage.setItem('darkModeOverrideExpiry', 
    (Date.now() + SEASONAL_CONFIG.overrideDuration).toString()
  );
  
  return newValue;
};

/**
 * Clear dark mode override
 */
export const clearDarkModeOverride = () => {
  localStorage.removeItem('darkModeOverride');
  localStorage.removeItem('darkModeOverrideExpiry');
};

/**
 * Get current dark mode information for debugging
 * @returns {Object} Debug information
 */
export const getDarkModeInfo = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours + (minutes / 60);
  const { start, end } = getSeasonalHours();
  const isDark = shouldBeDarkMode();
  
  const override = localStorage.getItem('darkModeOverride');
  const overrideExpiry = localStorage.getItem('darkModeOverrideExpiry');
  const hasOverride = override && overrideExpiry && Date.now() < parseInt(overrideExpiry);
  
  return {
    isDarkMode: isDark,
    currentTime: currentTime.toFixed(2),
    darkStart: start.toFixed(2),
    darkEnd: end.toFixed(2),
    hemisphere: SEASONAL_CONFIG.hemisphere,
    currentSeason: getCurrentSeason(now.getMonth()),
    hasOverride,
    overrideValue: hasOverride ? override : null
  };
};

/**
 * Create a dark mode manager with auto-update capability
 * @param {Function} updateCallback - Function to call when dark mode changes
 * @returns {Object} Manager object with start/stop methods
 */
export const createDarkModeManager = (updateCallback) => {
  let checkInterval = null;
  let lastState = null;
  
  const check = () => {
    const currentState = shouldBeDarkMode();
    if (currentState !== lastState) {
      lastState = currentState;
      updateCallback(currentState);
    }
  };
  
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      check();
    }
  };
  
  return {
    start() {
      // Initial check
      check();
      
      // Check every minute
      checkInterval = setInterval(check, 60000);
      
      // Check when tab becomes visible
      document.addEventListener('visibilitychange', handleVisibilityChange);
    },
    
    stop() {
      if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    },
    
    toggle() {
      const newState = toggleDarkModeOverride();
      updateCallback(newState);
      return newState;
    },
    
    clearOverride() {
      clearDarkModeOverride();
      check();
    },
    
    getInfo() {
      return getDarkModeInfo();
    }
  };
};

// Export configuration updater for runtime changes
export const updateConfig = (newConfig) => {
  Object.assign(SEASONAL_CONFIG, newConfig);
};