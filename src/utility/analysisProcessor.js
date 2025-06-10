// utility/analysisProcessor.js
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

  async getAdviceData(userId, adviceWidgetIds) {
    try {
      const results = {};
      
      for (const [key, widgetId] of Object.entries(adviceWidgetIds)) {
        results[key] = await this.processAdviceData(userId, widgetId);
      }
      
      return results;
    } catch (error) {
      console.error('Error getting advice data:', error);
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

  async processAdviceData(userId, widgetId) {
    try {
      // Get widget configuration and user records
      const [widget, records] = await Promise.all([
        widgetService.getWidget(widgetId),
        recordService.getWidgetRecords(userId, widgetId)
      ]);

      if (!records || records.length === 0 || !widget.entries) {
        return [];
      }

      // Get the most recent record for advice
      const latestRecord = records[0];
      
      if (!latestRecord.values || !Array.isArray(latestRecord.values)) {
        return [];
      }

      // Process the new object format data
      const adviceData = [];
      
      latestRecord.values.forEach((valueObject, index) => {
        if (widget.entries[index] && valueObject && typeof valueObject === 'object') {
          // Handle the new object format: { contents: "...", description: "..." }
          const entry = widget.entries[index];
          
          adviceData.push({
            title: entry.name,
            content: valueObject.contents || 'アドバイスデータがありません',
            description: valueObject.description || ' 詳細情報がありません'
          });
        } else if (widget.entries[index] && typeof valueObject === 'number') {
          // Fallback: Handle legacy numerical format if needed
          const entry = widget.entries[index];
          const translatedContent = this.translateNumericalToString(valueObject, index);
          
          adviceData.push({
            title: entry.name,
            content: translatedContent
          });
        }
      });

      return adviceData;
    } catch (error) {
      console.error('Error processing advice data:', error);
      return [];
    }
  },

  // Keep these methods for backward compatibility or legacy data
  translateNumericalToString(numericalValue, entryIndex) {
    // The numerical value is a direct index to the advice string table
    // Create your advice lookup tables here - one table per entry type
    
    const adviceTables = {
      0: [ // Advice strings for first entry (主体性)
        "目標を明確に設定し、小さなステップから始めてみましょう。",
        "自分の意見を積極的に発言する練習をしてみてください。",
        "責任を持って物事に取り組む姿勢を大切にしましょう。",
        "新しいチャレンジを恐れずに積極的に挑戦してみてください。",
        "リーダーシップの役割を積極的に引き受けてみましょう。",
        "自分の価値観を明確にし、それに基づいて行動しましょう。",
        "決断力を養うために、日々の小さな選択から意識してみてください。",
        "自分の強みを活かせる場面を積極的に探してみましょう。",
        "他者の意見に左右されすぎず、自分の判断を信じてください。",
        "失敗を恐れずに、学びの機会として捉えてみましょう。"
      ],
      1: [ // Advice strings for second entry (方向性)
        "長期的な視点で物事を考える習慣をつけてみましょう。",
        "定期的に自分の進路を見直す時間を作ってください。",
        "メンターや先輩からアドバイスを求めてみましょう。",
        "自分の価値観と目標の整合性を確認してください。",
        "キャリアプランを具体的に書き出してみましょう。",
        "多様な経験を積むことで視野を広げてみてください。",
        "定期的に自己分析を行い、方向性を調整しましょう。",
        "業界の動向や将来性について情報収集してみてください。",
        "自分の理想とする将来像を明確にイメージしてみましょう。",
        "短期目標と長期目標のバランスを取ってみてください。"
      ],
      2: [ // Advice strings for third entry (実行力)
        "タスクを細分化して、達成しやすい形にしてみましょう。",
        "時間管理のスキルを向上させる方法を学んでみてください。",
        "優先順位をつけて、重要なことから取り組みましょう。",
        "継続的な習慣作りから始めてみてください。",
        "完璧を求めすぎず、まずは行動を起こしてみましょう。",
        "進捗を可視化して、モチベーションを維持しましょう。",
        "周囲のサポートを積極的に活用してみてください。",
        "定期的な振り返りで改善点を見つけてみましょう。",
        "集中力を高める環境作りを心がけてみてください。",
        "小さな成功体験を積み重ねて自信をつけましょう。"
      ]
      // Add more advice tables for additional entries as needed
    };

    // Get the advice table for this entry
    const adviceTable = adviceTables[entryIndex];
    
    if (!adviceTable) {
      return `エントリー${entryIndex}に対するアドバイスデータがありません。`;
    }

    // Use the numerical value as direct index
    const adviceIndex = Math.floor(numericalValue);
    
    if (adviceIndex < 0 || adviceIndex >= adviceTable.length) {
      return `インデックス${adviceIndex}に対応するアドバイスが見つかりません。`;
    }

    return adviceTable[adviceIndex];
  },

  // Alternative method if you have a separate advice translation service
  async translateNumericalToStringAdvanced(numericalValue, entryIndex, /*widgetId*/) {
    try {
      // You could call an external translation service or use a more complex lookup
      // For example, if you have a separate collection for translations:
      
      // const translationDoc = await db.collection('translations')
      //   .doc(widgetId)
      //   .collection('entries')
      //   .doc(entryIndex.toString())
      //   .get();
      
      // if (translationDoc.exists) {
      //   const translations = translationDoc.data().translations;
      //   const normalizedValue = Math.floor(numericalValue / 20); // Convert to appropriate scale
      //   return translations[normalizedValue] || `Default advice for value ${numericalValue}`;
      // }
      
      return this.translateNumericalToString(numericalValue, entryIndex);
    } catch (error) {
      console.error('Error in advanced translation:', error);
      return this.translateNumericalToString(numericalValue, entryIndex);
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