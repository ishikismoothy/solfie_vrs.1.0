// services/analysisService.js
import { widgetService } from '@/firebase/firebaseWidget';
import { recordService } from '@/firebase/firebaseRecrods';

export const analysisService = {
  async getAnalysisData(userId, widgetIds) {
    try {
      const results = {};
      
      for (const [key, widgetId] of Object.entries(widgetIds)) {
        results[key] = await this.processWidgetAnalysis(userId, widgetId);
      }
      
      return results;
    } catch (error) {
      console.error('Error getting analysis data:', error);
      throw error;
    }
  },

  async processWidgetAnalysis(userId, widgetId) {
    try {
      // Get widget configuration and user records
      const [widget, records] = await Promise.all([
        widgetService.getWidget(widgetId),
        recordService.getWidgetRecords(userId, widgetId)
      ]);
      
      //console.log("analysisProcessor.js/processWidgetAnalysis",records);

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

      return result;
    } catch (error) {
      console.error('Error processing widget analysis:', error);
      return { '今日': { percentage: 0, items: {} } };
    }
  },

  groupRecordsByTime(records) {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    return {
      '今日': records.slice(0, 1), // Most recent
      '6ヶ月': records.filter(record => {
        const recordDate = record.analysisDate.toDate ? 
          record.analysisDate.toDate() : 
          new Date(record.analysisDate);
        return recordDate >= sixMonthsAgo;
      }),
      '1年': records.filter(record => {
        const recordDate = record.analysisDate.toDate ? 
          record.analysisDate.toDate() : 
          new Date(record.analysisDate);
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
          if (entries[index] && typeof value === 'number') {
            totals[entries[index].name] += value;
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
}