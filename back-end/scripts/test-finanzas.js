import mongoose from 'mongoose';
import Finanzas from '../models/finanzas.model.js';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/mueblesDB');
        console.log('Connected to DB');

        const selectedYear = 2025;
        const startDate = new Date(selectedYear, 0, 1);
        const endDate = new Date(selectedYear, 11, 31, 23, 59, 59);

        console.log('Date range:', startDate, endDate);

        // Métricas generales
        console.log('Running metrics aggregation...');
        const metricsAggregation = await Finanzas.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalIngresos: {
                        $sum: { $cond: [{ $eq: ['$type', 'ingreso'] }, '$amountBOB', 0] }
                    },
                    totalEgresos: {
                        $sum: { $cond: [{ $eq: ['$type', 'egreso'] }, '$amountBOB', 0] }
                    },
                    countIngresos: {
                        $sum: { $cond: [{ $eq: ['$type', 'ingreso'] }, 1, 0] }
                    },
                    countEgresos: {
                        $sum: { $cond: [{ $eq: ['$type', 'egreso'] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalIngresos: 1,
                    totalEgresos: 1,
                    countIngresos: 1,
                    countEgresos: 1,
                    utilidadNeta: { $subtract: ['$totalIngresos', '$totalEgresos'] }
                }
            }
        ]);
        console.log('Metrics result:', metricsAggregation);

        // Cashflow mensual
        console.log('Running cashflow aggregation...');
        const cashflow = await Finanzas.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' }
                    },
                    ingresos: {
                        $sum: { $cond: [{ $eq: ['$type', 'ingreso'] }, '$amountBOB', 0] }
                    },
                    egresos: {
                        $sum: { $cond: [{ $eq: ['$type', 'egreso'] }, '$amountBOB', 0] }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    period: '$_id',
                    ingresos: 1,
                    egresos: 1,
                    flujoNeto: { $subtract: ['$ingresos', '$egresos'] }
                }
            },
            { $sort: { 'period.month': 1 } }
        ]);
        console.log('Cashflow result:', cashflow);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
