import { Injectable } from '@nestjs/common';
import { IPlugin, PluginManifest, PluginPermission } from '../../core/plugins/plugin.interface';
import { PluginContext } from '../../core/plugins/plugin.context';

/**
 * Report Generator Plugin
 * Demonstrates a plugin that adds reporting capabilities
 */
@Injectable()
export class ReportGeneratorPlugin implements IPlugin {
  readonly manifest: PluginManifest = {
    id: 'report-generator',
    name: 'Advanced Report Generator',
    version: '1.0.0',
    description: 'Generate custom reports with PDF/Excel export',
    author: 'MindBloom Team',
    homepage: 'https://mindbloom.io/plugins/report-generator',
    permissions: [
      PluginPermission.READ_STUDENTS,
      PluginPermission.READ_FEES,
    ],
    dependencies: {
      core: '>=1.0.0',
    },
    provides: {
      routes: [
        {
          path: '/plugins/reports/generate',
          method: 'POST',
          handler: 'generateReport',
          permissions: [PluginPermission.READ_STUDENTS],
        },
        {
          path: '/plugins/reports/templates',
          method: 'GET',
          handler: 'getTemplates',
        },
        {
          path: '/plugins/reports/:id/download',
          method: 'GET',
          handler: 'downloadReport',
        },
      ],
      menuItems: [
        {
          label: 'Reports',
          icon: '📊',
          route: '/plugins/reports',
          parent: 'system',
          order: 20,
        },
      ],
      dashboardWidgets: [
        {
          id: 'recent-reports',
          title: 'Recent Reports',
          component: 'RecentReportsWidget',
          size: 'medium',
        },
      ],
      settings: [
        {
          key: 'defaultFormat',
          label: 'Default Export Format',
          type: 'select',
          options: [
            { label: 'PDF', value: 'pdf' },
            { label: 'Excel', value: 'xlsx' },
            { label: 'CSV', value: 'csv' },
          ],
          defaultValue: 'pdf',
        },
        {
          key: 'includeLogo',
          label: 'Include School Logo',
          type: 'boolean',
          defaultValue: true,
        },
        {
          key: 'autoArchive',
          label: 'Auto-archive after (days)',
          type: 'number',
          defaultValue: 30,
        },
      ],
    },
  };

  async onInstall(context: PluginContext): Promise<void> {
    context.logger.log('Installing Report Generator Plugin...');

    // Create default report templates
    const defaultTemplates = [
      {
        id: 'student-list',
        name: 'Student List Report',
        description: 'Complete list of all students',
        type: 'table',
        columns: ['Name', 'Class', 'Roll No', 'Contact'],
      },
      {
        id: 'fee-collection',
        name: 'Fee Collection Report',
        description: 'Summary of fee collections',
        type: 'summary',
        columns: ['Month', 'Collected', 'Pending', 'Total'],
      },
      {
        id: 'attendance-summary',
        name: 'Attendance Summary',
        description: 'Monthly attendance statistics',
        type: 'chart',
        chartType: 'bar',
      },
    ];

    await context.settings.set('reportTemplates', defaultTemplates);
    await context.settings.set('generatedReports', []);

    context.logger.log('Report Generator Plugin installed successfully');
  }

  async onEnable(context: PluginContext): Promise<void> {
    context.logger.log('Enabling Report Generator Plugin...');

    // Register scheduled task for auto-archiving
    const autoArchiveDays = await context.settings.get('autoArchive') || 30;
    
    // In production: register cron job
    context.logger.log(`Auto-archive configured for ${autoArchiveDays} days`);

    context.logger.log('Report Generator Plugin enabled');
  }

  async onDisable(context: PluginContext): Promise<void> {
    context.logger.log('Disabling Report Generator Plugin...');
    
    // Cancel scheduled tasks
    // In production: cancel cron jobs
    
    context.logger.log('Report Generator Plugin disabled');
  }

  async onUninstall(context: PluginContext): Promise<void> {
    context.logger.log('Uninstalling Report Generator Plugin...');

    // Clean up generated reports
    const reports = await context.settings.get('generatedReports') || [];
    context.logger.log(`Cleaning up ${reports.length} generated reports`);

    // In production: delete report files from storage
    
    await context.settings.clear();

    context.logger.log('Report Generator Plugin uninstalled');
  }

  // Route handlers

  async generateReport(context: PluginContext, payload: any): Promise<any> {
    const { templateId, filters, format } = payload;

    // Validate permissions
    if (!context.hasPermission(PluginPermission.READ_STUDENTS)) {
      throw new Error('Insufficient permissions');
    }

    const templates = await context.settings.get('reportTemplates') || [];
    const template = templates.find((t: any) => t.id === templateId);

    if (!template) {
      throw new Error('Template not found');
    }

    const defaultFormat = await context.settings.get('defaultFormat') || 'pdf';
    const exportFormat = format || defaultFormat;

    // Generate report (simulated)
    const report = {
      id: `report_${Date.now()}`,
      templateId,
      templateName: template.name,
      format: exportFormat,
      filters,
      generatedAt: new Date(),
      size: '2.5 MB',
      status: 'completed',
    };

    // Store generated report
    const reports = await context.settings.get('generatedReports') || [];
    reports.push(report);
    await context.settings.set('generatedReports', reports);

    context.logger.log(`Report generated: ${report.id}`);

    return report;
  }

  async getTemplates(context: PluginContext): Promise<any[]> {
    return await context.settings.get('reportTemplates') || [];
  }

  async downloadReport(context: PluginContext, reportId: string): Promise<any> {
    const reports = await context.settings.get('generatedReports') || [];
    const report = reports.find((r: any) => r.id === reportId);

    if (!report) {
      throw new Error('Report not found');
    }

    context.logger.log(`Downloading report: ${reportId}`);

    // In production: return actual file stream
    return {
      id: report.id,
      filename: `${report.templateName}_${reportId}.${report.format}`,
      contentType: this.getContentType(report.format),
      url: `/downloads/reports/${reportId}`,
    };
  }

  private getContentType(format: string): string {
    const types: Record<string, string> = {
      pdf: 'application/pdf',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
    };
    return types[format] || 'application/octet-stream';
  }
}
