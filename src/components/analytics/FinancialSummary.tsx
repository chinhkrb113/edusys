"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import KpiCard from "./KpiCard";
import { DollarSignIcon, AlertCircleIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const outstandingPayments = [
    { student: "Phạm Thị Dung", amount: "2,500,000", dueDate: "2024-10-25" },
    { student: "Hoàng Văn Em", amount: "1,800,000", dueDate: "2024-10-28" },
];

const FinancialSummary = () => {
  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
            <KpiCard
                title="Tổng doanh thu"
                value="2.8 Tỷ"
                icon={DollarSignIcon}
                description="Tính từ đầu năm"
            />
            <KpiCard
                title="Công nợ"
                value="150 Triệu"
                icon={AlertCircleIcon}
                description="Tổng học phí chưa thanh toán"
            />
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Công nợ học phí</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Học viên</TableHead>
                            <TableHead>Số tiền</TableHead>
                            <TableHead>Hạn nộp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {outstandingPayments.map(item => (
                            <TableRow key={item.student}>
                                <TableCell>{item.student}</TableCell>
                                <TableCell>{item.amount} VND</TableCell>
                                <TableCell>{item.dueDate}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
};

export default FinancialSummary;