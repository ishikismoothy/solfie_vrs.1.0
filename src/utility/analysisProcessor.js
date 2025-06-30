// utility/analysisProcessor.js
import { widgetService } from '@/firebase/firebaseWidget';
import { recordService } from '@/firebase/firebaseRecrods';
import { getAvailableWidgets } from '@/config/widgetConfig';

export const analysisService = {
  async getAnalysisData(userId, currentThemeId, usersWidgets) {
    try {
      console.log('🎯 Getting analysis data for theme:', currentThemeId);
      console.log('👥 Users widgets config:', usersWidgets);
      
      if (!currentThemeId || !usersWidgets) {
        console.warn('⚠️ Missing theme or widget configuration');
        return {};
      }

      // Get only widgets that are available in current theme
      const availableWidgets = getAvailableWidgets(currentThemeId, usersWidgets, false);
      console.log('📊 Available widgets for current theme:', availableWidgets);
      
      const results = {};
      
      for (const [key, widgetId] of Object.entries(availableWidgets)) {
        console.log(`🔍 Processing ${key} with widget ${widgetId}`);
        results[key] = await this.processWidgetAnalysis(userId, currentThemeId, widgetId);
      }
      
      // Fill in empty results for unavailable widgets
      const allKeys = ['data_A', 'data_B', 'data_C'];
      allKeys.forEach(key => {
        if (!results[key]) {
          results[key] = { '今日': { percentage: 0, items: {} } };
        }
      });
      
      return results;
    } catch (error) {
      console.error('❌ Error getting analysis data:', error);
      throw error;
    }
  },

  async getAdviceData(userId, currentThemeId, usersWidgets) {
    try {
      console.log('💡 Getting advice data for theme:', currentThemeId);
      
      if (!currentThemeId || !usersWidgets) {
        console.warn('⚠️ Missing theme or widget configuration for advice');
        return {};
      }

      // Get only advice widgets that are available in current theme
      const availableAdviceWidgets = getAvailableWidgets(currentThemeId, usersWidgets, true);
      console.log('💡 Available advice widgets for current theme:', availableAdviceWidgets);
      
      const results = {};
      
      for (const [key, widgetId] of Object.entries(availableAdviceWidgets)) {
        console.log(`💡 Processing advice ${key} with widget ${widgetId}`);
        results[key] = await this.processAdviceData(userId, currentThemeId, widgetId);
      }
      
      // Fill in empty results for unavailable advice widgets
      const allKeys = ['advice_A', 'advice_B', 'advice_C'];
      allKeys.forEach(key => {
        if (!results[key]) {
          results[key] = [];
        }
      });
      
      return results;
    } catch (error) {
      console.error('❌ Error getting advice data:', error);
      throw error;
    }
  },

  async processWidgetAnalysis(userId, currentThemeId, widgetId) {
    try {
      console.log('🔍 Processing widget analysis for:', { userId, currentThemeId, widgetId });
      
      // Get widget configuration and user records for specific theme-widget combination
      const [widget, records] = await Promise.all([
        widgetService.getWidget(widgetId),
        recordService.getThemeWidgetRecords(userId, currentThemeId, widgetId)
      ]);

      if (records.length === 0) {
        console.log('📭 No records found for theme-widget combination');
        return { '今日': { percentage: 0, items: {} } };
      }

      console.log(`📈 Found ${records.length} records for ${widgetId} in theme ${currentThemeId}`);

      // Group records by time periods
      const timeGroups = this.groupRecordsByTime(records);
      
      // Process each time group
      const result = {};
      for (const [period, periodRecords] of Object.entries(timeGroups)) {
        if (periodRecords.length > 0) {
          result[period] = this.calculateAverages(periodRecords, widget.entries);
        }
      }

      console.log('✅ Widget analysis result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error processing widget analysis:', error);
      return { '今日': { percentage: 0, items: {} } };
    }
  },

  async processAdviceData(userId, currentThemeId, widgetId) {
    try {
      console.log('🎯 Processing advice data for:', { userId, currentThemeId, widgetId });
      
      // Get widget configuration and user records for specific theme-widget combination
      const [widget, records] = await Promise.all([
        widgetService.getWidget(widgetId),
        recordService.getThemeWidgetRecords(userId, currentThemeId, widgetId)
      ]);

      if (!records || records.length === 0 || !widget.entries) {
        console.log('📭 No advice records found for theme-widget combination');
        return [];
      }

      // Get the most recent record for advice
      const latestRecord = records[0];
      
      if (!latestRecord.values || !Array.isArray(latestRecord.values)) {
        console.log('📭 Latest record has no valid values');
        return [];
      }

      console.log(`💡 Processing advice from latest record with ${latestRecord.values.length} values`);

      // Process the advice data from the object format
      const adviceData = [];
      
      latestRecord.values.forEach((valueObject, index) => {
        if (widget.entries[index]) {
          const entry = widget.entries[index];
          
          if (valueObject && typeof valueObject === 'object' && valueObject.contents !== undefined) {
            // Handle the object format: { contents: "...", description: "..." }
            adviceData.push({
              title: entry.name,
              content: valueObject.contents || 'アドバイスデータがありません',
              description: valueObject.description || '詳細情報がありません'
            });
          } else if (typeof valueObject === 'string') {
            // Handle string content
            adviceData.push({
              title: entry.name,
              content: valueObject,
              description: '詳細情報がありません'
            });
          } else if (typeof valueObject === 'number') {
            // Handle numeric values (convert to advice format)
            adviceData.push({
              title: entry.name,
              content: `スコア: ${valueObject}`,
              description: `${entry.description || entry.name}の評価値: ${valueObject}`
            });
          } else {
            // Fallback for any other format
            console.warn(`⚠️ Unexpected value format for advice ${index}:`, valueObject);
            adviceData.push({
              title: entry.name,
              content: 'データ形式が予期されていません',
              description: '詳細情報がありません'
            });
          }
        }
      });

      console.log('✅ Advice data processed:', adviceData);
      return adviceData;
    } catch (error) {
      console.error('❌ Error processing advice data:', error);
      return [];
    }
  },

  groupRecordsByTime(records) {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    return {
      '今日': records.slice(0, 1), // Most recent
      '6ヶ月': records.filter(record => {
        const recordDate = record.createdAt?.toDate ? 
          record.createdAt.toDate() : 
          new Date(record.createdAt);
        return recordDate >= sixMonthsAgo;
      }),
      '1年': records.filter(record => {
        const recordDate = record.createdAt?.toDate ? 
          record.createdAt.toDate() : 
          new Date(record.createdAt);
        return recordDate >= oneYearAgo;
      })
    };
  },

  calculateAverages(records, entries) {
    if (!records || records.length === 0 || !entries) {
      return { percentage: 0, items: {} };
    }

    // Initialize totals for each entry
    const totals = {};
    entries.forEach((entry) => {
      totals[entry.name] = 0;
    });

    // Sum up values across all records
    records.forEach(record => {
      if (record.values && Array.isArray(record.values)) {
        record.values.forEach((value, index) => {
          if (entries[index]) {
            // Handle both numeric values and object values
            let numericValue = 0;
            if (typeof value === 'number') {
              numericValue = value;
            } else if (typeof value === 'object' && typeof value.value === 'number') {
              // If the object has a numeric 'value' property
              numericValue = value.value;
            }
            
            totals[entries[index].name] += numericValue;
          }
        });
      }
    });

    // Calculate averages
    const items = {};
    let totalSum = 0;
    let entryCount = 0;

    Object.keys(totals).forEach(entryName => {
      const average = Math.round(totals[entryName] / records.length);
      items[entryName] = average;
      totalSum += average;
      entryCount++;
    });

    // Calculate overall percentage
    const percentage = entryCount > 0 ? Math.round(totalSum / entryCount) : 0;

    return {
      percentage,
      items
    };
  }
};