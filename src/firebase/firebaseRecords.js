// firebase/firebaseRecords.js
import { db } from './firebaseInit';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';

export const recordService = {
    // Get user's widget configuration (usersWidgets)
    async getUsersWidgets(userId) {
        try {
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);
            
            if (!userDoc.exists()) {
                console.warn('⚠️ User document not found');
                return {};
            }
            
            const userData = userDoc.data();
            const usersWidgets = userData.usersWidgets || {};
            
            console.log('✅ UsersWidgets retrieved:', usersWidgets);
            return usersWidgets;
        } catch (error) {
            console.error('❌ Error getting usersWidgets:', error);
            throw error;
        }
    },

    async getUserRecords(userId, currentThemeId = null, widgetId = null) {
        try {
            // Always start with basic user filter
            let recordsQuery = query(
                collection(db, 'records'),
                where('uid', '==', userId),
                orderBy('createdAt', 'desc')
            );

            const recordsSnapshot = await getDocs(recordsQuery);
            
            const allRecords = [];
            
            recordsSnapshot.forEach((doc) => {
                const docData = doc.data();
                allRecords.push({
                    id: doc.id,
                    ...docData
                });
            });

            // Filter in JavaScript for theme-widget combination
            let filteredRecords = allRecords;
            
            if (currentThemeId && widgetId) {
                filteredRecords = allRecords.filter(record => {
                    const hasThemeData = record.record && 
                                        record.record[currentThemeId] && 
                                        record.record[currentThemeId][widgetId];
                    
                    return hasThemeData;
                });
            } else if (currentThemeId) {
                filteredRecords = allRecords.filter(record => {
                    return record.record && record.record[currentThemeId];
                });
            }

            console.log(`✅ Retrieved ${filteredRecords.length} records for user`);
            return filteredRecords;
        } catch (error) {
            console.error('❌ Error fetching records:', error);
            throw error;
        }
    },

    async getThemeWidgetRecords(userId, currentThemeId, widgetId) {
        try {
            const records = await this.getUserRecords(userId, currentThemeId, widgetId);
            
            // Extract and format the specific widget data
            const formattedRecords = records
                .filter(record => {
                    return record.record && 
                           record.record[currentThemeId] && 
                           record.record[currentThemeId][widgetId];
                })
                .map(record => {
                    const widgetValues = record.record[currentThemeId][widgetId];
                    
                    return {
                        id: record.id,
                        createdAt: record.createdAt,
                        analysisDate: record.analysisDate || record.createdAt, // Fallback
                        values: widgetValues
                    };
                });
            
            console.log(`✅ Formatted ${formattedRecords.length} theme-widget records`);
            return formattedRecords;
        } catch (error) {
            console.error('❌ Error fetching theme-widget records:', error);
            throw error;
        }
    },

    // Helper method to check if current theme has specific widget
    async checkThemeHasWidget(userId, currentThemeId, widgetId) {
        try {
            const usersWidgets = await this.getUsersWidgets(userId);
            const themeWidgets = usersWidgets[currentThemeId] || [];
            
            const hasWidget = themeWidgets.includes(widgetId);
            
            return hasWidget;
        } catch (error) {
            console.error('❌ Error checking theme-widget relationship:', error);
            return false;
        }
    },

    // Get all widgets assigned to current theme
    async getThemeWidgets(userId, currentThemeId) {
        try {
            const usersWidgets = await this.getUsersWidgets(userId);
            const themeWidgets = usersWidgets[currentThemeId] || [];
            
            return themeWidgets;
        } catch (error) {
            console.error('❌ Error getting theme widgets:', error);
            return [];
        }
    },

    // Debug method to see all records structure
    async debugRecordsStructure(userId, limit = 3) {
        try {
            console.log('🔧 DEBUG: Analyzing records structure for user:', userId);
            
            const recordsQuery = query(
                collection(db, 'records'),
                where('uid', '==', userId),
                orderBy('createdAt', 'desc')
            );

            const recordsSnapshot = await getDocs(recordsQuery);
            const records = [];
            
            let count = 0;
            recordsSnapshot.forEach(doc => {
                if (count < limit) {
                    const data = doc.data();
                    records.push({
                        id: doc.id,
                        structure: this.analyzeRecordStructure(data.record),
                        createdAt: data.createdAt
                    });
                    count++;
                }
            });
            
            console.log('🔧 DEBUG: Records structure analysis:', records);
            return records;
        } catch (error) {
            console.error('❌ Error in debug analysis:', error);
            return [];
        }
    },

    analyzeRecordStructure(record) {
        if (!record) return { themes: [], structure: 'No record data' };
        
        const themes = Object.keys(record);
        const structure = {};
        
        themes.forEach(themeId => {
            if (record[themeId] && typeof record[themeId] === 'object') {
                structure[themeId] = {
                    widgets: Object.keys(record[themeId]),
                    widgetCount: Object.keys(record[themeId]).length
                };
            }
        });
        
        return { themes, structure };
    }
};