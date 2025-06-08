// firebase/firebaserecords.js
import { db } from './firebaseInit';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

export const recordService = {
    async getUserRecords(userId, widgetId = null) {
        try {
            console.log('🔍 Starting getUserRecords with:', { userId, widgetId });
            
            let recordsQuery;
            
            if (widgetId) {
                console.log('📊 Querying for specific widget:', widgetId);
                // Fixed: Use 'uid' instead of 'userId' and order by 'createdAt' instead of 'analysisDate'
                recordsQuery = query(
                    collection(db, 'records'),
                    where('uid', '==', userId), // Changed from 'userId' to 'uid'
                    where(`record.${widgetId}`, '!=', null),
                    orderBy('createdAt', 'desc') // Changed from 'analysisDate' to 'createdAt'
                );
            } else {
                console.log('📊 Querying for all user records');
                // Fixed: Use 'uid' instead of 'userId'
                recordsQuery = query(
                    collection(db, 'records'),
                    where('uid', '==', userId), // Changed from 'userId' to 'uid'
                    orderBy('createdAt', 'desc') // Changed from 'analysisDate' to 'createdAt'
                );
            }

            console.log('🔄 Executing query...');
            const recordsSnapshot = await getDocs(recordsQuery);
            console.log('📈 Query result - Empty?', recordsSnapshot.empty);
            console.log('📈 Query result - Size:', recordsSnapshot.size);
            
            const records = [];
            
            recordsSnapshot.forEach((doc, index) => {
                const docData = doc.data();
                console.log(`📄 Document ${index + 1}:`, {
                    id: doc.id,
                    uid: docData.uid,
                    hasRecord: !!docData.record,
                    recordKeys: docData.record ? Object.keys(docData.record) : [],
                    analysisDate: docData.analysisDate,
                    createdAt: docData.createdAt
                });
                
                records.push({
                    id: doc.id,
                    ...docData
                });
            });

            console.log('✅ Final records array length:', records.length);
            return records;
        } catch (error) {
            console.error('❌ Error fetching records:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message
            });
            throw error;
        }
    },

    async getWidgetRecords(userId, widgetId) {
        try {
            console.log('🎯 Starting getWidgetRecords with:', { userId, widgetId });
            
            const records = await this.getUserRecords(userId, widgetId);
            console.log('📋 Raw records from getUserRecords:', records.length);
            
            // Debug: Check each record
            records.forEach((record, index) => {
                console.log(`Record ${index}:`, {
                    id: record.id,
                    uid: record.uid,
                    hasRecord: !!record.record,
                    hasWidgetData: record.record && !!record.record[widgetId],
                    widgetData: record.record ? record.record[widgetId] : null,
                    createdAt: record.createdAt,
                    analysisDate: record.analysisDate
                });
            });
            
            const filteredRecords = records
                .filter(record => {
                    const hasData = record.record && record.record[widgetId];
                    console.log(`Filtering record ${record.id}: ${hasData ? 'PASS' : 'FAIL'}`);
                    return hasData;
                })
                .map(record => ({
                    id: record.id,
                    analysisDate: record.analysisDate,
                    createdAt: record.createdAt,
                    values: record.record[widgetId]
                }));
            
            console.log('✅ Final filtered records:', filteredRecords.length);
            return filteredRecords;
        } catch (error) {
            console.error('❌ Error fetching widget records:', error);
            throw error;
        }
    },

    // Alternative method if you still have index issues
    async getUserRecordsSimple(userId, widgetId = null) {
        try {
            console.log('🔍 Simple query for uid:', userId);
            
            // Query without orderBy first
            const recordsQuery = query(
                collection(db, 'records'),
                where('uid', '==', userId) // Use 'uid' field
            );

            const recordsSnapshot = await getDocs(recordsQuery);
            console.log('📈 Simple query result - Size:', recordsSnapshot.size);
            
            const records = [];
            recordsSnapshot.forEach(doc => {
                const data = doc.data();
                console.log('📄 Document found:', {
                    id: doc.id,
                    uid: data.uid,
                    hasRecord: !!data.record,
                    recordKeys: data.record ? Object.keys(data.record) : []
                });
                
                // Filter by widget if specified
                if (!widgetId || (data.record && data.record[widgetId])) {
                    records.push({
                        id: doc.id,
                        ...data
                    });
                }
            });

            // Sort by createdAt in JavaScript instead of Firestore
            records.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
                const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
                return dateB - dateA; // Descending order (newest first)
            });

            console.log('✅ Sorted records:', records.length);
            return records;
        } catch (error) {
            console.error('❌ Error in simple query:', error);
            throw error;
        }
    }
};

// Updated analysis service to handle your date format
export const analysisServiceUpdated = {
    groupRecordsByTime(records) {
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

        return {
            '今日': records.slice(0, 1), // Most recent
            '6ヶ月': records.filter(record => {
                // Handle both string dates and Firestore timestamps
                let recordDate;
                if (typeof record.analysisDate === 'string') {
                    recordDate = new Date(record.analysisDate);
                } else if (record.createdAt?.toDate) {
                    recordDate = record.createdAt.toDate();
                } else {
                    recordDate = new Date(record.createdAt);
                }
                return recordDate >= sixMonthsAgo;
            }),
            '1年': records.filter(record => {
                // Handle both string dates and Firestore timestamps
                let recordDate;
                if (typeof record.analysisDate === 'string') {
                    recordDate = new Date(record.analysisDate);
                } else if (record.createdAt?.toDate) {
                    recordDate = record.createdAt.toDate();
                } else {
                    recordDate = new Date(record.createdAt);
                }
                return recordDate >= oneYearAgo;
            })
        };
    }
};