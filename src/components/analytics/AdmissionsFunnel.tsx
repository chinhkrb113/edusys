"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FunnelChart, Funnel, Tooltip, LabelList, ResponsiveContainer } from 'recharts';

const funnelData = [
  { value: 100, name: 'Leads', fill: '#8884d8' },
  { value: 80, name: 'Demo', fill: '#83a6ed' },
  { value: 50, name: 'Enroll', fill: '#8dd1e1' },
  { value: 40, name: 'Active', fill: '#82ca9d' },
];

const AdmissionsFunnel = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Phễu tuyển sinh</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <FunnelChart>
            <Tooltip />
            <Funnel dataKey="value" data={funnelData} isAnimationActive>
              <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default AdmissionsFunnel;