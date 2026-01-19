import { A11yModule } from '@angular/cdk/a11y';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
    MbAlertComponent,
    MbButtonComponent,
    MbCardComponent,
    MbClassSelectorComponent,
    MbCheckboxComponent,
    MbDrawerComponent,
    MbDrawerFooterDirective,
    MbFormFieldComponent,
    MbInputComponent,
    MbModalComponent,
    MbModalFooterDirective,
    MbPopoverComponent,
    MbRoleSelectorComponent,
    MbSchoolSelectorComponent,
    MbSelectComponent,
    MbSplitButtonComponent,
    MbStaffSelectorComponent,
    MbTableActionsDirective,
    MbTableComponent,
    MbTextareaComponent,
    MbTooltipDirective,
} from '@mindbloom/ui';
import { AddressComponent } from '../../../../shared/components/address/address.component';
import { CountrySelectComponent } from '../../../../shared/components/country-select/country-select.component';
import { TimezoneSelectComponent } from '../../../../shared/components/timezone-select/timezone-select.component';
import { SearchInputComponent } from '../../../../shared/components/search-input/search-input.component';
import { DepartmentSelectorComponent } from '../../../../shared/components/department-selector/department-selector.component';
import { RolePreviewComponent } from './role-preview.component';
import { OrgUnitMembersTableComponent } from './org-units/org-unit-members-table.component';
import { OrgUnitRolesTableComponent } from './org-units/org-unit-roles-table.component';

export const TENANT_WORKSPACE_SETUP_IMPORTS = [
    CommonModule,
    FormsModule,
    RouterModule,
    A11yModule,
    DragDropModule,
    MbCardComponent,
    MbButtonComponent,
    MbClassSelectorComponent,
    MbFormFieldComponent,
    MbInputComponent,
    MbModalComponent,
    MbModalFooterDirective,
    MbPopoverComponent,
    MbRoleSelectorComponent,
    MbSchoolSelectorComponent,
    MbSelectComponent,
    MbSplitButtonComponent,
    MbStaffSelectorComponent,
    MbAlertComponent,
    MbTableComponent,
    MbTableActionsDirective,
    MbTextareaComponent,
    MbCheckboxComponent,
    MbDrawerComponent,
    MbDrawerFooterDirective,
    MbTooltipDirective,
    AddressComponent,
    CountrySelectComponent,
    TimezoneSelectComponent,
    SearchInputComponent,
    DepartmentSelectorComponent,
    RolePreviewComponent,
    OrgUnitMembersTableComponent,
    OrgUnitRolesTableComponent,
];
