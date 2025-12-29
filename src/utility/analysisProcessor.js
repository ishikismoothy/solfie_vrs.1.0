// utility/analysisProcessor.js
import { widgetService } from '@/firebase/firebaseWidget';
import { recordService } from '@/firebase/firebaseRecords';
import { getAvailableWidgets } from '@/config/widgetConfig';

/**
 * Calculate date info for a set of records
 * @param {Array} records - Array of records with analysisDate field
 * @param {string} periodType - '今日', '6ヶ月', or '1年'
 * @returns {Object} dateInfo object
 */
const calculateDateInfo = (records, periodType) => {
  if (!records || records.length === 0) {
    return null;
  }

  // Get analysisDate from records (format: "YYYY-MM-DD")
  const getAnalysisDate = (record) => {
    if (record.analysisDate) {
      return record.analysisDate;
    }
    // Fallback to createdAt if analysisDate is not available
    if (record.createdAt) {
      const date = record.createdAt.toDate ? record.createdAt.toDate() : new Date(record.createdAt);
      return date.toISOString().split('T')[0];
    }
    return null;
  };

  // Format date from "YYYY-MM-DD" to "YYYY/MM/DD"
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return dateStr.replace(/-/g, '/');
  };

  // Calculate coverage text based on actual date range
  const calculateCoverageText = (oldestDateStr, newestDateStr, recordCount) => {
    if (recordCount === 1) {
      return '1件';
    }

    if (!oldestDateStr || !newestDateStr) {
      return `${recordCount}件`;
    }

    const oldest = new Date(oldestDateStr);
    const newest = new Date(newestDateStr);
    const diffTime = Math.abs(newest - oldest);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      return `${diffDays}日分`;
    } else if (diffDays < 30) {
      const weeks = Math.round(diffDays / 7);
      return `約${weeks}週間分`;
    } else if (diffDays < 365) {
      const months = Math.round(diffDays / 30);
      return `約${months}ヶ月分`;
    } else {
      const years = Math.round(diffDays / 365 * 10) / 10;
      return `約${years}年分`;
    }
  };

  // Get dates from records
  const dates = records
    .map(record => getAnalysisDate(record))
    .filter(date => date !== null)
    .sort((a, b) => new Date(b) - new Date(a)); // Sort descending (newest first)

  if (dates.length === 0) {
    return null;
  }

  const newestDate = dates[0];
  const oldestDate = dates[dates.length - 1];
  const recordCount = records.length;

  // Determine display type
  const isSingleRecord = recordCount === 1 || periodType === '今日';
  const isSameDate = newestDate === oldestDate;

  if (isSingleRecord || isSameDate) {
    return {
      type: 'single',
      newestDate: formatDate(newestDate),
      oldestDate: formatDate(oldestDate),
      recordCount,
      coverageText: recordCount > 1 ? `${recordCount}件` : null
    };
  }

  return {
    type: 'range',
    newestDate: formatDate(newestDate),
    oldestDate: formatDate(oldestDate),
    recordCount,
    coverageText: calculateCoverageText(oldestDate, newestDate, recordCount)
  };
};

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
      const allKeys = ['data_A', 'data_B', 'data_C', 'data_D'];
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
      const allKeys = ['advice_A', 'advice_B', 'advice_C', 'advice_D'];
      allKeys.forEach(key => {
        if (!results[key]) {
          results[key] = { items: [], dateInfo: null };
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
        return { '今日': { percentage: 0, items: {}, dateInfo: null } };
      }

      // Group records by time periods
      const timeGroups = this.groupRecordsByTime(records);

      // Process each time group
      const result = {};
      for (const [period, periodRecords] of Object.entries(timeGroups)) {
        if (periodRecords.length > 0) {
          const averages = this.calculateAverages(periodRecords, widget.entries);
          const dateInfo = calculateDateInfo(periodRecords, period);
          result[period] = {
            ...averages,
            dateInfo
          };
        }
      }

      console.log('✅ Widget analysis result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error processing widget analysis:', error);
      return { '今日': { percentage: 0, items: {}, dateInfo: null } };
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
        return { items: [], dateInfo: null };
      }

      // Get the most recent record for advice
      const latestRecord = records[0];

      if (!latestRecord.values || !Array.isArray(latestRecord.values)) {
        return { items: [], dateInfo: null };
      }

      // Calculate dateInfo for the latest record
      const dateInfo = calculateDateInfo([latestRecord], 'アドバイス');

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

      console.log('✅ Advice data processed:', { items: adviceData, dateInfo });
      return { items: adviceData, dateInfo };
    } catch (error) {
      console.error('❌ Error processing advice data:', error);
      return { items: [], dateInfo: null };
    }
  },

  groupRecordsByTime(records) {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    const getRecordDate = (record) => {
      return record.createdAt?.toDate ?
        record.createdAt.toDate() :
        new Date(record.createdAt);
    };

    return {
      '今日': records.slice(0, 1), // Most recent
      '6ヶ月': records.filter(record => {
        const recordDate = getRecordDate(record);
        return recordDate >= sixMonthsAgo;
      }),
      '1年': records.filter(record => {
        const recordDate = getRecordDate(record);
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
          results[key] = { data: null, dateInfo: null };
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
        return { data: null, dateInfo: null };
      }

      // Get the most recent record
      const latestRecord = records[0];

      // Calculate dateInfo for the latest record
      const dateInfo = calculateDateInfo([latestRecord], 'テキスト');

      // Check if this record has widget data
      if (!latestRecord || !latestRecord.values || !Array.isArray(latestRecord.values) || latestRecord.values.length === 0) {
        return { data: null, dateInfo };
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

        console.log('✅ Text data processed:', { data: textData, dateInfo });
        return { data: textData, dateInfo };
      } else if (typeof valueObject === 'string') {
        // Handle string format (backwards compatibility)
        return {
          data: { content: valueObject, description: '' },
          dateInfo
        };
      } else if (typeof valueObject === 'number') {
        // Handle numeric values
        return {
          data: { content: valueObject.toString(), description: '' },
          dateInfo
        };
      }

      console.warn('⚠️ Unexpected text data format:', typeof valueObject, valueObject);
      return { data: null, dateInfo };
    } catch (error) {
      console.error('❌ Error processing text data:', error);
      return { data: null, dateInfo: null };
    }
  },
};