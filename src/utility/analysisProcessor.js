// utility/analysisProcessor.js
import { widgetService } from '@/firebase/firebaseWidget';
import { recordService } from '@/firebase/firebaseRecords';
import { getAvailableWidgets } from '@/config/widgetConfig';

export const analysisService = {
  async getAnalysisData(userId, currentThemeId, usersWidgets) {
    try {
      if (!currentThemeId || !usersWidgets) {
        console.warn('⚠️ Missing theme or widget configuration');
        return {};
      }

      // Get only widgets that are available in current theme
      const availableWidgets = getAvailableWidgets(currentThemeId, usersWidgets, false);

      const results = {};

      for (const [key, widgetId] of Object.entries(availableWidgets)) {
        results[key] = await this.processWidgetAnalysis(userId, currentThemeId, widgetId);
      }

      // Fill in empty results for unavailable widgets
      const allKeys = ['data_A', 'data_B', 'data_C'];
      allKeys.forEach(key => {
        if (!results[key]) {
          results[key] = { '今日': { percentage: 0, items: {} } };
        }
      });

      console.log('✅ Analysis data loaded:', results);
      return results;
    } catch (error) {
      console.error('❌ Error getting analysis data:', error);
      throw error;
    }
  },

  async getAdviceData(userId, currentThemeId, usersWidgets) {
    try {
      if (!currentThemeId || !usersWidgets) {
        console.warn('⚠️ Missing theme or widget configuration for advice');
        return {};
      }

      // Get only advice widgets that are available in current theme
      const availableAdviceWidgets = getAvailableWidgets(currentThemeId, usersWidgets, true);

      const results = {};

      for (const [key, widgetId] of Object.entries(availableAdviceWidgets)) {
        results[key] = await this.processAdviceData(userId, currentThemeId, widgetId);
      }

      // Fill in empty results for unavailable advice widgets
      const allKeys = ['advice_A', 'advice_B', 'advice_C'];
      allKeys.forEach(key => {
        if (!results[key]) {
          results[key] = [];
        }
      });

      console.log('✅ Advice data loaded:', results);
      return results;
    } catch (error) {
      console.error('❌ Error getting advice data:', error);
      throw error;
    }
  },

  async processWidgetAnalysis(userId, currentThemeId, widgetId) {
    try {
      // Get widget configuration and user records for specific theme-widget combination
      const [widget, records] = await Promise.all([
        widgetService.getWidget(widgetId),
        recordService.getThemeWidgetRecords(userId, currentThemeId, widgetId)
      ]);

      if (records.length === 0) {
        return { '今日': { percentage: 0, items: {} } };
      }

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
      // Get widget configuration and user records for specific theme-widget combination
      const [widget, records] = await Promise.all([
        widgetService.getWidget(widgetId),
        recordService.getThemeWidgetRecords(userId, currentThemeId, widgetId)
      ]);

      if (!records || records.length === 0 || !widget.entries) {
        return [];
      }

      // Get the most recent record for advice
      const latestRecord = records[0];

      if (!latestRecord.values || !Array.isArray(latestRecord.values)) {
        return [];
      }

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
  },

  async getTextData(userId, currentThemeId, usersWidgets) {
    try {
      if (!currentThemeId || !usersWidgets) {
        console.warn('⚠️ Missing theme or widget configuration for text widgets');
        return {};
      }

      // Get only text widgets that are available in current theme
      const availableTextWidgets = getAvailableWidgets(currentThemeId, usersWidgets, false, true);

      const results = {};

      for (const [key, widgetId] of Object.entries(availableTextWidgets)) {
        results[key] = await this.processTextData(userId, currentThemeId, widgetId);
      }

      // Fill in empty results for unavailable text widgets
      const allKeys = ['text_A', 'text_B', 'text_C'];
      allKeys.forEach(key => {
        if (!results[key]) {
          results[key] = null;
        }
      });

      console.log('✅ Text data loaded:', results);
      return results;
    } catch (error) {
      console.error('❌ Error getting text data:', error);
      throw error;
    }
  },

  async processTextData(userId, currentThemeId, widgetId) {
    try {
      // Get widget configuration and user records for specific theme-widget combination
      const [/*widget*/, records] = await Promise.all([
        widgetService.getWidgetById(widgetId), // Fixed: use getWidgetById
        recordService.getThemeWidgetRecords(userId, currentThemeId, widgetId)
      ]);

      if (!records || records.length === 0) {
        return null;
      }

      // Get the most recent record
      const latestRecord = records[0];

      // Check if this record has widget data
      if (!latestRecord || !latestRecord.values || !Array.isArray(latestRecord.values) || latestRecord.values.length === 0) {
        return null;
      }

      // Process the text data - expecting object format: { contents: "...", description: "..." }
      const valueObject = latestRecord.values[0]; // Text widgets typically have one entry

      if (valueObject && typeof valueObject === 'object') {
        // Handle various possible property names
        const textData = {
          // For the quote text: check for 'contents', 'content', or 'value'
          content: valueObject.contents || valueObject.content || valueObject.value || '',
          // For the author/description: check for 'description', 'author', or 'name'
          description: valueObject.description || valueObject.author || valueObject.name || ''
        };

        console.log('✅ Text data processed:', textData);
        return textData;
      } else if (typeof valueObject === 'string') {
        // Handle string format (backwards compatibility)
        return {
          content: valueObject,
          description: ''
        };
      } else if (typeof valueObject === 'number') {
        // Handle numeric values
        return {
          content: valueObject.toString(),
          description: ''
        };
      }

      console.warn('⚠️ Unexpected text data format:', typeof valueObject, valueObject);
      return null;
    } catch (error) {
      console.error('❌ Error processing text data:', error);
      return null;
    }
  },
};
