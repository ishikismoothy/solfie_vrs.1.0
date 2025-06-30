// config/widgetConfig.js: Support text widgets

// Fixed widget IDs for each data category (these never change)
export const WIDGET_CONFIG = {
  data_A: 'CC4ZpLD5Sz2DmwrTG84l',    // Decision Making Power
  data_B: 'GORz1h6ts9Vq2PKMD6un',    // Body, Mind, Spirit
  data_C: 'n33Khwkw7gKSmo8ZNxhk',    // 活動、環境、姿
};

export const ADVICE_WIDGET_CONFIG = {
  advice_A: 'uf4CdAcKO6Z3zKfRYidJ',  // Decision Making Power-アドバイス
  advice_B: 'ti0ualOvvQpHB1vq81DX',  // Body, Mind, Spirit-アドバイス
  advice_C: 'rezpOM7Kk7R780BzhqvW',  // 活動、環境、姿-アドバイス
};

// WIDGET FOR TEXT ONLY DATA
export const TEXT_WIDGET_CONFIG = {
  text_A: 's4MoRxueN0CznLEXU6ei',  // 選択のワンポイント
  text_B: 'rQ5VgqQIuxsYlmC3Y0PP',  // Solfieからの一言
  text_C: '',  // Reserved for future use
};

// Helper function to check if current theme has the required widget
export function getCurrentThemeWidgetConfig(currentThemeId, usersWidgets, isAdvice = false, isText = false) {
  let widgetConfig;
  
  if (isText) {
    widgetConfig = TEXT_WIDGET_CONFIG;
  } else if (isAdvice) {
    widgetConfig = ADVICE_WIDGET_CONFIG;
  } else {
    widgetConfig = WIDGET_CONFIG;
  }
  
  const result = {};
  
  // Get widgets assigned to current theme
  const themeWidgets = usersWidgets[currentThemeId] || [];
  
  // Check each widget category to see if it exists in current theme
  Object.entries(widgetConfig).forEach(([key, widgetId]) => {
    // Skip empty widget IDs
    if (!widgetId) {
      return;
    }
    
    if (themeWidgets.includes(widgetId)) {
      result[key] = {
        themeId: currentThemeId,
        widgetId: widgetId,
        available: true
      };
    } else {
      result[key] = {
        themeId: currentThemeId,
        widgetId: widgetId,
        available: false
      };
    }
  });
  
  return result;
}

// Helper function to get only available widgets for current theme
export function getAvailableWidgets(currentThemeId, usersWidgets, isAdvice = false, isText = false) {
  const config = getCurrentThemeWidgetConfig(currentThemeId, usersWidgets, isAdvice, isText);
  const available = {};
  
  Object.entries(config).forEach(([key, widgetInfo]) => {
    if (widgetInfo.available) {
      available[key] = widgetInfo.widgetId;
    }
  });
  
  return available;
}