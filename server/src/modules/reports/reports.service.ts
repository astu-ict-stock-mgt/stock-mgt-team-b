import {PrismaClient,TransactionType} from "@prisma/client";

const prisma = new PrismaClient();

export interface ReportFilters{
    dateFrom?:Date;
    dateTo?:Date;
    warehouseId?:string;
    supplierId?:string;
    inventoryItemId?:string;
}

function buildDateFilter(dateFrom?:Date,dateTo?:Date){
    if(!dateFrom && !dateTo){
        return undefined;
    }

    return{
        ...(dateFrom?{gte:dateFrom}:{}),
        ...PrismaClient(dateTo?{lte:dateTo}:{}),
    };
}

/**
 * Stock movement report
 */

export async function getStockMovementReport(
    filters:ReportFilters ={},
){
    const createdAt=buildDateFilter(
        filters.dateFrom,
        filters.dateTo,
    );

    const where ={
        ...(createdAt?{createdAt}:{}),
        ...(filters.warehouseId ?{warehouse:filters.warehouseId}
            :{}
        ),
        ...(filters.supplierId?{supplierId:filters.supplierId}:{}),
        ...(filters.inventoryItemId?{inventoryItemId:filters.inventoryItemId}
            :{}
        ),
    };

    const transactions =await prisma.stockTransaction.findMany({
        where,
        orderBy:{
            createdAt:"desc",
        },
        select:{
            id:true,
            type:true,
            inventoryItemId:true,
            warehouseId:true,
            quantity:true,
            unitCost:true,
            totalValue:true,
            receivedDate:true,
            referenceNumber:true,
            supplierId:true,
            userId:true,
            createdAt:true,
        },
    });

    const summary={
        totalTransactions:transactions.length,
        totalReceived:0,
        totalIssued:0,
        totalTransferred:0,
        totalAdjusted:0,
    };

    for(const transaction of transactions){
        switch(transaction.type){
            case TransactionType.RECEIVE:
                summary.totalReceived +=
                transaction.quantity;
                break;

                case TransactionType.ISSUE:
                    summary.totalIssued +=transaction.quantity;
                break;
                case TransactionType.TRANSFER:
                    summary.totalTransferred += transaction.quantity;
                break;

                case TransactionType.ADJUSTMENT:
                    summary.totalAdjusted += 
                    transaction.quantity;
                break;

        }
    }
    return{
        summary,
        transactions,
    };
}

//Receiving report

export async function getReceivingReport(
    filters:ReportFilters = {},
){
    const createdAt =buildDateFilter(
        filters.dateFrom,
        filters.dateTo,
    );

    const where = {
        type:TransactionType.RECEIVE,
        ...(createdAt ?{createdAt}:{}),
        ...(filters.warehouseId ?{warehouseId:filters.warehouseId}
            :{}
        ),
        ...(filters.supplierId ?{supplierId:filters.supplierId}
            :{}
        ),
    };

    const transactions = await
    prisma.stockTransaction.findMany({
        where,
        orderBy:{
            createdAt:"desc",
        },

        select:{
            id:true,
            inventoryItemId:true,
            warehouseId:true,
            quantity:true,
            unitCost:true,
            totalValue:true,
            receivedDate:true,
            referenceNumber:true,
            supplierId:true,
            userId:true,
            createdAt:true,
        },
    });

    const totalQuantity = transactions.reduce(
        (total,transaction)=>total +
        transaction.quantity,0,
    );

    const totalValue = transactions.reduce(
        (total,transaction)=>
            total + (transaction.totalValue ?? 0),0,
    );

    return {
        summary:{
            totalReceipts:transactions.length,
            totalQuantity,
            totalValue,
        },
        transactions,
    };
}
//issuing report

export async function getIssuingReport(
    filters:ReportFilters = {},
){
    const createdAt =buildDateFilter(
        filters.dateFrom,
        filters.dateTo,
    );

    const where ={
        type:TransactionType.ISSUE,
        ...(createdAt ?{createdAt}:{}),
        ...(filters.warehouseId ?
            {warehouseId:filters.warehouseId}:{}
        ),
    };

    const transactions = await 
    prisma.stockTransaction.findMany({
        where,
        orderBy:{
            createdAt:"desc",
        },
        select:{
            id:true,
            inventoryItemId:true,
            warehouseId:true,
            quantity:true,
            unitCost:true,
            totalValue:true,
            referenceNumber:true,
            userId:true,
            createdAt:true,
        },
    });

    const totalQuantity = transactions.reduce(
        (total,transaction)=>total +
        transaction.quantity,0,
    );

    const totalValue = transactions.reduce(
        (total,transaction)=>
            total + (transaction.totalValue ?? 0),0,
    );

    return  {
        summary:{
            totalIssues:transactions.length,
            totalQuantity,
            totalValue,
        },
        transactions,
    };
}