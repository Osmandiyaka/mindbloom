import { Component, EventEmitter, Input, OnInit, Output, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
    MbAlertComponent,
    MbButtonComponent,
    MbCardComponent,
    MbCheckboxComponent,
    MbFormFieldComponent,
    MbInputComponent,
    MbComboBoxComponent,
    MbComboBoxOption,
} from '@mindbloom/ui';
import { TenantSettingsService } from '../../../../core/services/tenant-settings.service';
import { TenantService } from '../../../../core/services/tenant.service';
import { SchoolService } from '../../../../core/school/school.service';
import { SchoolContextService } from '../../../../core/school/school-context.service';
import { TenantOnboardingService, TenantOnboardingState, OnboardingSchoolRow } from '../../../../core/services/tenant-onboarding.service';
import { UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';

type SchoolMode = 'single' | 'multi';

@Component({
    selector: 'app-tenant-onboarding',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MbCardComponent,
        MbFormFieldComponent,
        MbInputComponent,
        MbComboBoxComponent,
        MbCheckboxComponent,
        MbButtonComponent,
        MbAlertComponent,
    ],
    templateUrl: './tenant-onboarding.component.html',
    styleUrls: ['./tenant-onboarding.component.scss']
})
export class TenantOnboardingComponent implements OnInit {
    private readonly tenantSettings = inject(TenantSettingsService);
    private readonly tenantService = inject(TenantService);
    private readonly schoolService = inject(SchoolService);
    private readonly schoolContext = inject(SchoolContextService);
    private readonly onboardingStore = inject(TenantOnboardingService);
    private readonly userService = inject(UserService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    @Input() mode: 'onboarding' | 'registration' = 'onboarding';
    @Output() cancelled = new EventEmitter<void>();
    @Output() registered = new EventEmitter<{ tenantId: string; subdomain: string }>();

    step = signal<1 | 2 | 3 | 4>(1);
    isLoading = signal(true);
    isSaving = signal(false);
    errorMessage = signal('');
    submitAttempted = signal(false);

    tenantName = signal('');
    tenantCode = signal('');
    private readonly originalTenantCode = signal('');
    codeStatus = signal<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
    codeStatusMessage = signal('');
    private codeCheckTimer: number | null = null;

    orgCountry = signal('');
    orgContactEmail = signal('');
    orgNameTouched = signal(false);
    workspaceUrlTouched = signal(false);
    countryTouched = signal(false);
    contactEmailTouched = signal(false);
    countryOptions: MbComboBoxOption[] = [
        { label: 'Afghanistan', value: 'Afghanistan' },
        { label: 'Albania', value: 'Albania' },
        { label: 'Algeria', value: 'Algeria' },
        { label: 'American Samoa', value: 'American Samoa' },
        { label: 'Andorra', value: 'Andorra' },
        { label: 'Angola', value: 'Angola' },
        { label: 'Anguilla', value: 'Anguilla' },
        { label: 'Antarctica', value: 'Antarctica' },
        { label: 'Antigua and Barbuda', value: 'Antigua and Barbuda' },
        { label: 'Argentina', value: 'Argentina' },
        { label: 'Armenia', value: 'Armenia' },
        { label: 'Aruba', value: 'Aruba' },
        { label: 'Australia', value: 'Australia' },
        { label: 'Austria', value: 'Austria' },
        { label: 'Azerbaijan', value: 'Azerbaijan' },
        { label: 'Bahamas', value: 'Bahamas' },
        { label: 'Bahrain', value: 'Bahrain' },
        { label: 'Bangladesh', value: 'Bangladesh' },
        { label: 'Barbados', value: 'Barbados' },
        { label: 'Belarus', value: 'Belarus' },
        { label: 'Belgium', value: 'Belgium' },
        { label: 'Belize', value: 'Belize' },
        { label: 'Benin', value: 'Benin' },
        { label: 'Bermuda', value: 'Bermuda' },
        { label: 'Bhutan', value: 'Bhutan' },
        { label: 'Bolivia', value: 'Bolivia' },
        { label: 'Bonaire, Sint Eustatius and Saba', value: 'Bonaire, Sint Eustatius and Saba' },
        { label: 'Bosnia and Herzegovina', value: 'Bosnia and Herzegovina' },
        { label: 'Botswana', value: 'Botswana' },
        { label: 'Bouvet Island', value: 'Bouvet Island' },
        { label: 'Brazil', value: 'Brazil' },
        { label: 'British Indian Ocean Territory', value: 'British Indian Ocean Territory' },
        { label: 'Brunei Darussalam', value: 'Brunei Darussalam' },
        { label: 'Bulgaria', value: 'Bulgaria' },
        { label: 'Burkina Faso', value: 'Burkina Faso' },
        { label: 'Burundi', value: 'Burundi' },
        { label: 'Cambodia', value: 'Cambodia' },
        { label: 'Cameroon', value: 'Cameroon' },
        { label: 'Canada', value: 'Canada' },
        { label: 'Cape Verde', value: 'Cape Verde' },
        { label: 'Cayman Islands', value: 'Cayman Islands' },
        { label: 'Central African Republic', value: 'Central African Republic' },
        { label: 'Chad', value: 'Chad' },
        { label: 'Chile', value: 'Chile' },
        { label: 'China', value: 'China' },
        { label: 'Christmas Island', value: 'Christmas Island' },
        { label: 'Cocos (Keeling) Islands', value: 'Cocos (Keeling) Islands' },
        { label: 'Colombia', value: 'Colombia' },
        { label: 'Comoros', value: 'Comoros' },
        { label: 'Congo', value: 'Congo' },
        { label: 'Congo, Democratic Republic of the', value: 'Congo, Democratic Republic of the' },
        { label: 'Cook Islands', value: 'Cook Islands' },
        { label: 'Costa Rica', value: 'Costa Rica' },
        { label: 'Cote dIvoire', value: 'Cote dIvoire' },
        { label: 'Croatia', value: 'Croatia' },
        { label: 'Cuba', value: 'Cuba' },
        { label: 'Curacao', value: 'Curacao' },
        { label: 'Cyprus', value: 'Cyprus' },
        { label: 'Czechia', value: 'Czechia' },
        { label: 'Denmark', value: 'Denmark' },
        { label: 'Djibouti', value: 'Djibouti' },
        { label: 'Dominica', value: 'Dominica' },
        { label: 'Dominican Republic', value: 'Dominican Republic' },
        { label: 'Ecuador', value: 'Ecuador' },
        { label: 'Egypt', value: 'Egypt' },
        { label: 'El Salvador', value: 'El Salvador' },
        { label: 'Equatorial Guinea', value: 'Equatorial Guinea' },
        { label: 'Eritrea', value: 'Eritrea' },
        { label: 'Estonia', value: 'Estonia' },
        { label: 'Eswatini', value: 'Eswatini' },
        { label: 'Ethiopia', value: 'Ethiopia' },
        { label: 'Falkland Islands (Malvinas)', value: 'Falkland Islands (Malvinas)' },
        { label: 'Faroe Islands', value: 'Faroe Islands' },
        { label: 'Fiji', value: 'Fiji' },
        { label: 'Finland', value: 'Finland' },
        { label: 'France', value: 'France' },
        { label: 'French Guiana', value: 'French Guiana' },
        { label: 'French Polynesia', value: 'French Polynesia' },
        { label: 'French Southern Territories', value: 'French Southern Territories' },
        { label: 'Gabon', value: 'Gabon' },
        { label: 'Gambia', value: 'Gambia' },
        { label: 'Georgia', value: 'Georgia' },
        { label: 'Germany', value: 'Germany' },
        { label: 'Ghana', value: 'Ghana' },
        { label: 'Gibraltar', value: 'Gibraltar' },
        { label: 'Greece', value: 'Greece' },
        { label: 'Greenland', value: 'Greenland' },
        { label: 'Grenada', value: 'Grenada' },
        { label: 'Guadeloupe', value: 'Guadeloupe' },
        { label: 'Guam', value: 'Guam' },
        { label: 'Guatemala', value: 'Guatemala' },
        { label: 'Guernsey', value: 'Guernsey' },
        { label: 'Guinea', value: 'Guinea' },
        { label: 'Guinea-Bissau', value: 'Guinea-Bissau' },
        { label: 'Guyana', value: 'Guyana' },
        { label: 'Haiti', value: 'Haiti' },
        { label: 'Heard Island and McDonald Islands', value: 'Heard Island and McDonald Islands' },
        { label: 'Holy See', value: 'Holy See' },
        { label: 'Honduras', value: 'Honduras' },
        { label: 'Hong Kong', value: 'Hong Kong' },
        { label: 'Hungary', value: 'Hungary' },
        { label: 'Iceland', value: 'Iceland' },
        { label: 'India', value: 'India' },
        { label: 'Indonesia', value: 'Indonesia' },
        { label: 'Iran', value: 'Iran' },
        { label: 'Iraq', value: 'Iraq' },
        { label: 'Ireland', value: 'Ireland' },
        { label: 'Isle of Man', value: 'Isle of Man' },
        { label: 'Israel', value: 'Israel' },
        { label: 'Italy', value: 'Italy' },
        { label: 'Jamaica', value: 'Jamaica' },
        { label: 'Japan', value: 'Japan' },
        { label: 'Jersey', value: 'Jersey' },
        { label: 'Jordan', value: 'Jordan' },
        { label: 'Kazakhstan', value: 'Kazakhstan' },
        { label: 'Kenya', value: 'Kenya' },
        { label: 'Kiribati', value: 'Kiribati' },
        { label: 'Korea, Democratic Peoples Republic of', value: 'Korea, Democratic Peoples Republic of' },
        { label: 'Korea, Republic of', value: 'Korea, Republic of' },
        { label: 'Kuwait', value: 'Kuwait' },
        { label: 'Kyrgyzstan', value: 'Kyrgyzstan' },
        { label: 'Lao Peoples Democratic Republic', value: 'Lao Peoples Democratic Republic' },
        { label: 'Latvia', value: 'Latvia' },
        { label: 'Lebanon', value: 'Lebanon' },
        { label: 'Lesotho', value: 'Lesotho' },
        { label: 'Liberia', value: 'Liberia' },
        { label: 'Libya', value: 'Libya' },
        { label: 'Liechtenstein', value: 'Liechtenstein' },
        { label: 'Lithuania', value: 'Lithuania' },
        { label: 'Luxembourg', value: 'Luxembourg' },
        { label: 'Macao', value: 'Macao' },
        { label: 'Madagascar', value: 'Madagascar' },
        { label: 'Malawi', value: 'Malawi' },
        { label: 'Malaysia', value: 'Malaysia' },
        { label: 'Maldives', value: 'Maldives' },
        { label: 'Mali', value: 'Mali' },
        { label: 'Malta', value: 'Malta' },
        { label: 'Marshall Islands', value: 'Marshall Islands' },
        { label: 'Martinique', value: 'Martinique' },
        { label: 'Mauritania', value: 'Mauritania' },
        { label: 'Mauritius', value: 'Mauritius' },
        { label: 'Mayotte', value: 'Mayotte' },
        { label: 'Mexico', value: 'Mexico' },
        { label: 'Micronesia', value: 'Micronesia' },
        { label: 'Moldova', value: 'Moldova' },
        { label: 'Monaco', value: 'Monaco' },
        { label: 'Mongolia', value: 'Mongolia' },
        { label: 'Montenegro', value: 'Montenegro' },
        { label: 'Montserrat', value: 'Montserrat' },
        { label: 'Morocco', value: 'Morocco' },
        { label: 'Mozambique', value: 'Mozambique' },
        { label: 'Myanmar', value: 'Myanmar' },
        { label: 'Namibia', value: 'Namibia' },
        { label: 'Nauru', value: 'Nauru' },
        { label: 'Nepal', value: 'Nepal' },
        { label: 'Netherlands', value: 'Netherlands' },
        { label: 'New Caledonia', value: 'New Caledonia' },
        { label: 'New Zealand', value: 'New Zealand' },
        { label: 'Nicaragua', value: 'Nicaragua' },
        { label: 'Niger', value: 'Niger' },
        { label: 'Nigeria', value: 'Nigeria' },
        { label: 'North Macedonia', value: 'North Macedonia' },
        { label: 'Northern Mariana Islands', value: 'Northern Mariana Islands' },
        { label: 'Norway', value: 'Norway' },
        { label: 'Oman', value: 'Oman' },
        { label: 'Pakistan', value: 'Pakistan' },
        { label: 'Palau', value: 'Palau' },
        { label: 'Palestine, State of', value: 'Palestine, State of' },
        { label: 'Panama', value: 'Panama' },
        { label: 'Papua New Guinea', value: 'Papua New Guinea' },
        { label: 'Paraguay', value: 'Paraguay' },
        { label: 'Peru', value: 'Peru' },
        { label: 'Philippines', value: 'Philippines' },
        { label: 'Pitcairn', value: 'Pitcairn' },
        { label: 'Poland', value: 'Poland' },
        { label: 'Portugal', value: 'Portugal' },
        { label: 'Puerto Rico', value: 'Puerto Rico' },
        { label: 'Qatar', value: 'Qatar' },
        { label: 'Reunion', value: 'Reunion' },
        { label: 'Romania', value: 'Romania' },
        { label: 'Russian Federation', value: 'Russian Federation' },
        { label: 'Rwanda', value: 'Rwanda' },
        { label: 'Saint Barthelemy', value: 'Saint Barthelemy' },
        { label: 'Saint Helena, Ascension and Tristan da Cunha', value: 'Saint Helena, Ascension and Tristan da Cunha' },
        { label: 'Saint Kitts and Nevis', value: 'Saint Kitts and Nevis' },
        { label: 'Saint Lucia', value: 'Saint Lucia' },
        { label: 'Saint Martin (French part)', value: 'Saint Martin (French part)' },
        { label: 'Saint Pierre and Miquelon', value: 'Saint Pierre and Miquelon' },
        { label: 'Saint Vincent and the Grenadines', value: 'Saint Vincent and the Grenadines' },
        { label: 'Samoa', value: 'Samoa' },
        { label: 'San Marino', value: 'San Marino' },
        { label: 'Sao Tome and Principe', value: 'Sao Tome and Principe' },
        { label: 'Saudi Arabia', value: 'Saudi Arabia' },
        { label: 'Senegal', value: 'Senegal' },
        { label: 'Serbia', value: 'Serbia' },
        { label: 'Seychelles', value: 'Seychelles' },
        { label: 'Sierra Leone', value: 'Sierra Leone' },
        { label: 'Singapore', value: 'Singapore' },
        { label: 'Sint Maarten (Dutch part)', value: 'Sint Maarten (Dutch part)' },
        { label: 'Slovakia', value: 'Slovakia' },
        { label: 'Slovenia', value: 'Slovenia' },
        { label: 'Solomon Islands', value: 'Solomon Islands' },
        { label: 'Somalia', value: 'Somalia' },
        { label: 'South Africa', value: 'South Africa' },
        { label: 'South Georgia and the South Sandwich Islands', value: 'South Georgia and the South Sandwich Islands' },
        { label: 'South Sudan', value: 'South Sudan' },
        { label: 'Spain', value: 'Spain' },
        { label: 'Sri Lanka', value: 'Sri Lanka' },
        { label: 'Sudan', value: 'Sudan' },
        { label: 'Suriname', value: 'Suriname' },
        { label: 'Svalbard and Jan Mayen', value: 'Svalbard and Jan Mayen' },
        { label: 'Sweden', value: 'Sweden' },
        { label: 'Switzerland', value: 'Switzerland' },
        { label: 'Syrian Arab Republic', value: 'Syrian Arab Republic' },
        { label: 'Taiwan', value: 'Taiwan' },
        { label: 'Tajikistan', value: 'Tajikistan' },
        { label: 'Tanzania, United Republic of', value: 'Tanzania, United Republic of' },
        { label: 'Thailand', value: 'Thailand' },
        { label: 'Timor-Leste', value: 'Timor-Leste' },
        { label: 'Togo', value: 'Togo' },
        { label: 'Tokelau', value: 'Tokelau' },
        { label: 'Tonga', value: 'Tonga' },
        { label: 'Trinidad and Tobago', value: 'Trinidad and Tobago' },
        { label: 'Tunisia', value: 'Tunisia' },
        { label: 'Turkey', value: 'Turkey' },
        { label: 'Turkmenistan', value: 'Turkmenistan' },
        { label: 'Turks and Caicos Islands', value: 'Turks and Caicos Islands' },
        { label: 'Tuvalu', value: 'Tuvalu' },
        { label: 'Uganda', value: 'Uganda' },
        { label: 'Ukraine', value: 'Ukraine' },
        { label: 'United Arab Emirates', value: 'United Arab Emirates' },
        { label: 'United Kingdom', value: 'United Kingdom' },
        { label: 'United States', value: 'United States' },
        { label: 'United States Minor Outlying Islands', value: 'United States Minor Outlying Islands' },
        { label: 'Uruguay', value: 'Uruguay' },
        { label: 'Uzbekistan', value: 'Uzbekistan' },
        { label: 'Vanuatu', value: 'Vanuatu' },
        { label: 'Venezuela', value: 'Venezuela' },
        { label: 'Viet Nam', value: 'Viet Nam' },
        { label: 'Virgin Islands, British', value: 'Virgin Islands, British' },
        { label: 'Virgin Islands, U.S.', value: 'Virgin Islands, U.S.' },
        { label: 'Wallis and Futuna', value: 'Wallis and Futuna' },
        { label: 'Western Sahara', value: 'Western Sahara' },
        { label: 'Yemen', value: 'Yemen' },
        { label: 'Zambia', value: 'Zambia' },
        { label: 'Zimbabwe', value: 'Zimbabwe' },
    ];

    schoolMode = signal<SchoolMode>('single');
    schoolRows = signal<OnboardingSchoolRow[]>([]);
    existingSchoolCount = computed(() => this.schoolRows().filter(row => row.existing).length);

    editions = signal<Array<{ id: string; name: string; displayName: string; description?: string | null; features?: Record<string, string> }>>([]);
    selectedEditionId = signal<string>('');
    selectedEditionName = signal<string>('');

    createExtraAdmin = signal(false);
    adminFirstName = signal('');
    adminLastName = signal('');
    adminEmail = signal('');
    adminPassword = signal('');
    adminPasswordConfirm = signal('');
    adminFirstTouched = signal(false);
    adminLastTouched = signal(false);
    adminEmailTouched = signal(false);
    adminPasswordTouched = signal(false);
    adminPasswordConfirmTouched = signal(false);
    acceptTerms = signal(false);
    showAdminPassword = signal(false);
    showAdminConfirm = signal(false);

    readonly reviewSchools = computed(() => this.schoolRows().map(row => row.name).filter(Boolean));
    readonly stepTitle = computed(() => {
        if (this.isRegistrationMode()) {
            switch (this.step()) {
                case 1:
                    return 'Create your organization';
                case 2:
                    return 'Administrator details';
                default:
                    return 'Verification';
            }
        }
        switch (this.step()) {
            case 1:
                return 'Create your organization';
            case 2:
                return 'School structure';
            case 3:
                return 'Platform edition';
            default:
                return 'Administrator & review';
        }
    });
    readonly stepSubtitle = computed(() => {
        if (this.isRegistrationMode()) {
            switch (this.step()) {
                case 1:
                    return 'Set up your MindBloom workspace. You can update these details later in settings.';
                case 2:
                    return 'Set the primary administrator account for this workspace.';
                default:
                    return 'Confirm ownership to finish setting up your organization.';
            }
        }
        switch (this.step()) {
            case 1:
                return 'Set up your MindBloom workspace. You can update these details later in settings.';
            case 2:
                return 'How is your organization structured?';
            case 3:
                return 'Choose the MindBloom edition that fits your organization.';
            default:
                return 'Review your setup and confirm the administrator access.';
        }
    });
    readonly codeError = computed(() => {
        if (!this.shouldShowFieldError('workspaceUrl')) {
            return '';
        }
        const code = this.tenantCode().trim();
        if (!code.length) {
            return 'Please choose a valid workspace URL.';
        }
        if (!/^[a-z0-9-]+$/.test(code)) {
            return 'Please choose a valid workspace URL.';
        }
        if (this.codeStatus() === 'taken') {
            return '';
        }
        if (this.codeStatus() === 'error') {
            return 'Please choose a valid workspace URL.';
        }
        return '';
    });
    readonly orgNameError = computed(() => {
        if (!this.shouldShowFieldError('orgName')) {
            return '';
        }
        return this.tenantName().trim().length ? '' : 'Organization name is required.';
    });
    readonly countryError = computed(() => {
        if (!this.shouldShowFieldError('country')) {
            return '';
        }
        const value = this.orgCountry().trim();
        if (!value.length) {
            return 'Please select a country or region.';
        }
        const match = this.countryOptions.some(option => option.value.toLowerCase() === value.toLowerCase());
        return match ? '' : 'Please select a country or region.';
    });
    readonly codeHint = computed(() => {
        const status = this.codeStatus();
        if (status === 'checking') return 'Checking availability…';
        if (status === 'available') return 'This URL is available.';
        if (status === 'taken') return 'This URL is already in use.';
        if (status === 'error') return 'Could not verify workspace URL.';
        return 'This is the web address your team will use to sign in. Use lowercase letters, numbers, and hyphens only.';
    });
    readonly contactEmailError = computed(() => {
        if (!this.shouldShowFieldError('contactEmail')) {
            return '';
        }
        const email = this.orgContactEmail().trim();
        if (!email.length) {
            return 'Email address is required.';
        }
        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        return valid ? '' : 'Enter a valid email address.';
    });
    readonly validationSummary = computed(() => {
        const step = this.step();
        const errors: string[] = [];
        if (this.isRegistrationMode()) {
            if (step === 1) {
                if (this.shouldShowFieldError('orgName') && this.orgNameError()) errors.push(this.orgNameError());
                if (this.shouldShowFieldError('workspaceUrl') && this.codeError()) errors.push(this.codeError());
                if (this.shouldShowFieldError('country') && this.countryError()) errors.push(this.countryError());
                if (this.shouldShowFieldError('contactEmail') && this.contactEmailError()) errors.push(this.contactEmailError());
            } else if (step === 2) {
                if (this.shouldShowFieldError('adminFirst') && !this.adminFirstName().trim()) {
                    errors.push('Administrator first name is required.');
                }
                if (this.shouldShowFieldError('adminLast') && !this.adminLastName().trim()) {
                    errors.push('Administrator last name is required.');
                }
                if (this.shouldShowFieldError('adminEmail') && !this.adminEmail().trim()) {
                    errors.push('Administrator email is required.');
                }
                if (this.shouldShowFieldError('adminPassword') && this.adminPassword().trim().length < 8) {
                    errors.push('Administrator password must be at least 8 characters.');
                }
                if (this.shouldShowFieldError('adminPasswordConfirm') && this.adminPassword().trim() !== this.adminPasswordConfirm().trim()) {
                    errors.push('Administrator passwords must match.');
                }
            } else if (step === 3) {
                if (!this.acceptTerms()) errors.push('Accept the terms to continue.');
            }
            return errors;
        }

        if (step === 1) {
            if (this.orgNameError()) errors.push(this.orgNameError());
            if (this.codeError()) errors.push(this.codeError());
            if (this.countryError()) errors.push(this.countryError());
            if (this.contactEmailError()) errors.push(this.contactEmailError());
        } else if (step === 2) {
            const rows = this.schoolRows().filter(row => row.name.trim().length);
            if (!rows.length) errors.push('Add at least one school.');
            if (this.schoolMode() === 'multi' && rows.length !== this.schoolRows().length) {
                errors.push('Complete all school rows before continuing.');
            }
        } else if (step === 3) {
            if (!this.selectedEditionId()) errors.push('Select a MindBloom edition to continue.');
        } else if (step === 4 && this.createExtraAdmin()) {
            if (!this.adminFirstName().trim()) errors.push('Administrator first name is required.');
            if (!this.adminLastName().trim()) errors.push('Administrator last name is required.');
            if (!this.adminEmail().trim()) errors.push('Administrator email is required.');
            if (this.adminPassword().trim().length < 8) errors.push('Administrator password must be at least 8 characters.');
        }
        return errors;
    });
    readonly canContinue = computed(() => {
        const step = this.step();
        if (this.isRegistrationMode()) {
            if (step === 1) {
                if (this.codeStatus() === 'checking') return false;
                return !!this.tenantName().trim()
                    && !!this.tenantCode().trim()
                    && !!this.orgCountry().trim()
                    && !!this.orgContactEmail().trim()
                    && !this.codeError()
                    && !this.countryError()
                    && !this.contactEmailError();
            }
            if (step === 2) {
                return !!this.adminFirstName().trim()
                    && !!this.adminLastName().trim()
                    && !!this.adminEmail().trim()
                    && this.adminPassword().trim().length >= 8
                    && this.adminPassword().trim() === this.adminPasswordConfirm().trim();
            }
            if (step === 3) {
                return this.acceptTerms();
            }
            return false;
        }
        if (step === 1) {
            if (this.codeStatus() === 'checking') return false;
            return !!this.tenantName().trim()
                && !!this.tenantCode().trim()
                && !!this.orgCountry().trim()
                && !!this.orgContactEmail().trim()
                && !this.codeError()
                && !this.countryError()
                && !this.contactEmailError();
        }
        if (step === 2) {
            const rows = this.schoolRows().filter(row => row.name.trim().length);
            if (!rows.length) return false;
            if (this.schoolMode() === 'multi') {
                return rows.length === this.schoolRows().length;
            }
            return true;
        }
        if (step === 3) {
            return !!this.selectedEditionId();
        }
        if (step === 4) {
            if (!this.createExtraAdmin()) return true;
            return !!this.adminFirstName().trim()
                && !!this.adminLastName().trim()
                && !!this.adminEmail().trim()
                && this.adminPassword().trim().length >= 8;
        }
        return false;
    });
    readonly showValidationSummary = computed(() => {
        return this.validationSummary().length > 1 && (this.submitAttempted() || this.anyTouchedInStep());
    });
    private persistTimer: number | null = null;

    isRegistrationMode(): boolean {
        return this.mode === 'registration';
    }

    isAdminStepActive(): boolean {
        return this.isRegistrationMode() ? this.step() === 2 : this.step() === 2 || this.step() === 3;
    }

    isVerificationStepActive(): boolean {
        return this.isRegistrationMode() ? this.step() === 3 : this.step() === 4;
    }

    onCountryInput(value: string): void {
        this.orgCountry.set(value);
        this.countryTouched.set(true);
    }

    onCountryBlur(): void {
        this.countryTouched.set(true);
        const value = this.orgCountry().trim();
        if (!value.length) {
            return;
        }
        const match = this.countryOptions.find(option => option.value.toLowerCase() === value.toLowerCase());
        if (match) {
            this.orgCountry.set(match.value);
        } else {
            this.orgCountry.set('');
        }
    }

    constructor() {
        effect(() => {
            this.step();
            this.orgCountry();
            this.orgContactEmail();
            this.adminPasswordConfirm();
            this.acceptTerms();
            this.submitAttempted();
            this.schoolMode();
            this.schoolRows();
            this.selectedEditionId();
            this.selectedEditionName();
            this.createExtraAdmin();
            this.adminFirstName();
            this.adminLastName();
            this.adminEmail();
            this.adminPassword();

            if (this.isLoading()) {
                return;
            }

            this.schedulePersist();
        });
    }

    ngOnInit(): void {
        if (this.isRegistrationMode()) {
            this.isLoading.set(false);
            this.step.set(1);
            return;
        }
        this.loadInitialState();
    }

    private loadInitialState(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');

        this.tenantSettings.getSettings().subscribe({
            next: (tenant) => {
                this.tenantName.set(tenant.name || 'Organization');
                this.tenantCode.set(tenant.subdomain || '');
                this.originalTenantCode.set(tenant.subdomain || '');
                this.orgCountry.set(tenant.contactInfo?.address?.country || '');
                this.orgContactEmail.set(tenant.contactInfo?.email || '');

                const tenantId = tenant.id || this.tenantService.getTenantId();
                if (tenantId) {
                    const saved = this.onboardingStore.load(tenantId);
                    if (saved && !saved.completed) {
                        this.applySavedState(saved);
                    }
                }

                this.loadSchools();
                this.loadEditions();
                this.prefillAdmin();
                this.isLoading.set(false);
            },
            error: () => {
                this.errorMessage.set('Unable to load onboarding details. Please refresh and try again.');
                this.isLoading.set(false);
            }
        });
    }

    private loadSchools(): void {
        this.schoolService.listSchools().subscribe({
            next: (schools) => {
                if (schools.length > 1) {
                    this.schoolMode.set('multi');
                }
                if (schools.length > 0) {
                    this.schoolRows.set(schools.map(s => ({
                        id: s.id,
                        name: s.name,
                        code: s.code,
                        existing: true
                    })));
                } else {
                    const defaultName = this.tenantName() || 'School';
                    this.schoolRows.set([{ name: defaultName }]);
                }
            },
            error: () => {
                if (!this.schoolRows().length) {
                    this.schoolRows.set([{ name: this.tenantName() || 'School' }]);
                }
            }
        });
    }

    private loadEditions(): void {
        this.tenantService.listPublicEditions().subscribe({
            next: (editions) => {
                const active = editions.filter(e => e.isActive !== false);
                this.editions.set(active);
                if (!this.selectedEditionId() && active.length) {
                    this.selectEdition(active[0]);
                }
            },
            error: () => {
                this.editions.set([]);
            }
        });
    }

    private prefillAdmin(): void {
        const user = this.authService.getCurrentUser();
        if (user) {
            const parts = (user.name || '').trim().split(/\s+/).filter(Boolean);
            this.adminFirstName.set(parts[0] || '');
            this.adminLastName.set(parts.slice(1).join(' ') || '');
            this.adminEmail.set(user.email || '');
        }
    }

    setSchoolMode(mode: SchoolMode): void {
        this.schoolMode.set(mode);
        if (mode === 'single' && this.schoolRows().length > 1) {
            const existing = this.schoolRows().filter(row => row.existing);
            const first = existing[0] || this.schoolRows()[0];
            this.schoolRows.set(first ? [first] : [{ name: this.tenantName() || 'School' }]);
        }
    }

    addSchoolRow(): void {
        this.schoolRows.update(rows => [...rows, { name: '' }]);
    }

    removeSchoolRow(index: number): void {
        this.schoolRows.update(rows => rows.filter((_, idx) => idx !== index));
    }

    updateSchoolName(index: number, value: string): void {
        this.schoolRows.update(rows => rows.map((row, idx) => idx === index ? { ...row, name: value } : row));
    }

    updateSchoolCode(index: number, value: string): void {
        this.schoolRows.update(rows => rows.map((row, idx) => idx === index ? { ...row, code: value } : row));
    }

    onTenantCodeInput(value: string): void {
        const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
        this.tenantCode.set(normalized);
        this.workspaceUrlTouched.set(true);
        this.codeStatus.set('idle');
        this.codeStatusMessage.set('');

        if (!normalized) {
            return;
        }

        if (normalized === this.originalTenantCode()) {
            this.codeStatus.set('available');
            return;
        }

        if (this.codeCheckTimer) {
            window.clearTimeout(this.codeCheckTimer);
        }

        this.codeStatus.set('checking');
        this.codeCheckTimer = window.setTimeout(() => {
            this.tenantService.getTenantBySubdomain(normalized).subscribe({
                next: () => {
                    this.codeStatus.set('taken');
                },
                error: (err) => {
                    if (err?.status === 404) {
                        this.codeStatus.set('available');
                    } else {
                        this.codeStatus.set('error');
                    }
                }
            });
        }, 350);
    }

    selectEdition(edition: { id: string; displayName?: string; name: string }): void {
        this.selectedEditionId.set(edition.id);
        this.selectedEditionName.set(edition.displayName || edition.name);
    }

    editionFeatures(edition: { features?: Record<string, string> }): string[] {
        const entries = edition.features ? Object.values(edition.features) : [];
        return entries.filter(Boolean).slice(0, 4);
    }

    back(): void {
        const current = this.step();
        if (current > 1) {
            this.step.set((current - 1) as 1 | 2 | 3 | 4);
            this.submitAttempted.set(false);
            this.persistState();
        }
    }

    async next(): Promise<void> {
        this.submitAttempted.set(true);
        this.errorMessage.set('');
        const current = this.step();

        if (this.isRegistrationMode()) {
            if (!this.canContinue()) {
                return;
            }
            if (current === 3) {
                await this.registerTenant();
                return;
            }
            if (current < 3) {
                this.step.set((current + 1) as 1 | 2 | 3);
                this.submitAttempted.set(false);
            }
            return;
        }

        if (current === 1) {
            const ok = await this.saveOrganization();
            if (!ok) return;
        }
        if (current === 2) {
            const ok = await this.saveSchools();
            if (!ok) return;
        }
        if (current === 3) {
            const ok = await this.saveEdition();
            if (!ok) return;
        }
        if (current === 4) {
            await this.finishOnboarding();
            return;
        }

        if (current < 4) {
            this.step.set((current + 1) as 1 | 2 | 3 | 4);
            this.submitAttempted.set(false);
            this.persistState();
        }
    }

    saveAndExit(): void {
        this.persistState();
        this.router.navigateByUrl('/dashboard');
    }

    cancelRegistration(): void {
        this.cancelled.emit();
    }

    toggleAdminPassword(): void {
        this.showAdminPassword.update(value => !value);
    }

    toggleAdminConfirm(): void {
        this.showAdminConfirm.update(value => !value);
    }

    onOrgNameInput(value: string): void {
        this.tenantName.set(value);
        this.orgNameTouched.set(true);
    }

    onWorkspaceUrlBlur(): void {
        this.workspaceUrlTouched.set(true);
    }

    onContactEmailInput(value: string): void {
        this.orgContactEmail.set(value);
        this.contactEmailTouched.set(true);
    }

    onAdminFirstNameInput(value: string): void {
        this.adminFirstName.set(value);
        this.adminFirstTouched.set(true);
    }

    onAdminLastNameInput(value: string): void {
        this.adminLastName.set(value);
        this.adminLastTouched.set(true);
    }

    onAdminEmailInput(value: string): void {
        this.adminEmail.set(value);
        this.adminEmailTouched.set(true);
    }

    onAdminPasswordInput(value: string): void {
        this.adminPassword.set(value);
        this.adminPasswordTouched.set(true);
    }

    onAdminPasswordConfirmInput(value: string): void {
        this.adminPasswordConfirm.set(value);
        this.adminPasswordConfirmTouched.set(true);
    }

    private anyTouchedInStep(): boolean {
        const step = this.step();
        if (this.isRegistrationMode()) {
            if (step === 1) {
                return this.orgNameTouched() || this.workspaceUrlTouched()
                    || this.countryTouched() || this.contactEmailTouched();
            }
            if (step === 2) {
                return this.adminFirstTouched() || this.adminLastTouched()
                    || this.adminEmailTouched() || this.adminPasswordTouched()
                    || this.adminPasswordConfirmTouched();
            }
            return false;
        }
        if (step === 1) {
            return this.orgNameTouched() || this.workspaceUrlTouched()
                || this.countryTouched() || this.contactEmailTouched();
        }
        return false;
    }

    private shouldShowFieldError(field: 'orgName' | 'workspaceUrl' | 'country' | 'contactEmail'
        | 'adminFirst' | 'adminLast' | 'adminEmail' | 'adminPassword' | 'adminPasswordConfirm'): boolean {
        if (this.submitAttempted()) {
            return true;
        }
        switch (field) {
            case 'orgName':
                return this.orgNameTouched();
            case 'workspaceUrl':
                return this.workspaceUrlTouched();
            case 'country':
                return this.countryTouched();
            case 'contactEmail':
                return this.contactEmailTouched();
            case 'adminFirst':
                return this.adminFirstTouched();
            case 'adminLast':
                return this.adminLastTouched();
            case 'adminEmail':
                return this.adminEmailTouched();
            case 'adminPassword':
                return this.adminPasswordTouched();
            case 'adminPasswordConfirm':
                return this.adminPasswordConfirmTouched();
            default:
                return false;
        }
    }

    private async registerTenant(): Promise<void> {
        if (!this.acceptTerms()) {
            this.errorMessage.set('Please accept the terms to continue.');
            return;
        }
        this.isSaving.set(true);
        this.errorMessage.set('');
        try {
            const fullName = `${this.adminFirstName().trim()} ${this.adminLastName().trim()}`.trim();
            const tenant = await firstValueFrom(this.tenantService.createTenant({
                name: this.tenantName().trim(),
                subdomain: this.tenantCode().trim(),
                contactEmail: this.orgContactEmail().trim(),
                adminName: fullName,
                adminEmail: this.adminEmail().trim(),
                adminPassword: this.adminPassword().trim(),
                edition: 'trial',
                plan: 'trial',
                address: {
                    country: this.orgCountry().trim()
                }
            }));
            this.registered.emit({ tenantId: tenant.id, subdomain: tenant.subdomain });
        } catch (error: any) {
            this.errorMessage.set(
                error?.error?.message || 'Registration failed. This workspace URL may already be in use.'
            );
        } finally {
            this.isSaving.set(false);
        }
    }

    private async saveOrganization(): Promise<boolean> {
        this.isSaving.set(true);
        try {
            await firstValueFrom(this.tenantSettings.updateSettings({
                extras: {
                    onboarding: {
                        orgName: this.tenantName().trim() || undefined,
                        tenantCode: this.tenantCode().trim() || undefined,
                        country: this.orgCountry().trim() || undefined,
                        contactEmail: this.orgContactEmail().trim() || undefined,
                    }
                }
            }));
            return true;
        } catch {
            this.errorMessage.set('Unable to save organization details. Please review and try again.');
            return false;
        } finally {
            this.isSaving.set(false);
        }
    }

    private async saveSchools(): Promise<boolean> {
        const rows = this.schoolRows().filter(row => row.name.trim().length);
        if (!rows.length) {
            this.errorMessage.set('Please add at least one school.');
            return false;
        }

        this.isSaving.set(true);
        try {
            const newRows = rows.filter(row => !row.existing);
            for (const row of newRows) {
                await firstValueFrom(this.schoolService.createSchool({
                    name: row.name.trim(),
                    code: row.code?.trim() || undefined
                }));
            }
            if (newRows.length) {
                this.schoolContext.refreshSchools();
            }
            return true;
        } catch {
            this.errorMessage.set('Unable to save schools. Please try again.');
            return false;
        } finally {
            this.isSaving.set(false);
        }
    }

    private async saveEdition(): Promise<boolean> {
        if (!this.selectedEditionId()) {
            this.errorMessage.set('Please select an edition to continue.');
            return false;
        }

        this.isSaving.set(true);
        try {
            await firstValueFrom(this.tenantSettings.updateSettings({
                extras: {
                    onboarding: {
                        editionId: this.selectedEditionId(),
                        editionName: this.selectedEditionName()
                    }
                }
            }));
            return true;
        } catch {
            this.errorMessage.set('Unable to save edition selection. Please try again.');
            return false;
        } finally {
            this.isSaving.set(false);
        }
    }

    private async finishOnboarding(): Promise<void> {
        this.isSaving.set(true);
        try {
            if (this.createExtraAdmin()) {
                if (!this.adminFirstName().trim()
                    || !this.adminLastName().trim()
                    || !this.adminEmail().trim()
                    || this.adminPassword().trim().length < 8) {
                    this.errorMessage.set('Please provide admin name, email, and a valid password.');
                    this.isSaving.set(false);
                    return;
                }
                const fullName = `${this.adminFirstName().trim()} ${this.adminLastName().trim()}`.trim();
                await firstValueFrom(this.userService.createUser({
                    name: fullName,
                    email: this.adminEmail().trim(),
                    password: this.adminPassword().trim()
                }));
            }

            const tenantId = this.tenantService.getTenantId();
            if (tenantId) {
                this.onboardingStore.save(tenantId, {
                    step: 4,
                    completed: true,
                    org: {
                        country: this.orgCountry(),
                        contactEmail: this.orgContactEmail(),
                    },
                    schools: { mode: this.schoolMode(), rows: this.schoolRows() },
                    edition: { id: this.selectedEditionId(), name: this.selectedEditionName() },
                    admin: {
                        createExtraAdmin: this.createExtraAdmin(),
                        name: `${this.adminFirstName()} ${this.adminLastName()}`.trim(),
                        email: this.adminEmail(),
                    }
                });
            }
            await this.router.navigateByUrl('/dashboard');
        } catch {
            this.errorMessage.set('Unable to complete onboarding. Please try again.');
        } finally {
            this.isSaving.set(false);
        }
    }

    private applySavedState(saved: TenantOnboardingState): void {
        this.step.set(saved.step);
        if (saved.org.name) this.tenantName.set(saved.org.name);
        if (saved.org.code) this.tenantCode.set(saved.org.code);
        this.orgCountry.set(saved.org.country || '');
        this.orgContactEmail.set(saved.org.contactEmail || '');
        this.schoolMode.set(saved.schools.mode || 'single');
        if (saved.schools.rows?.length) {
            this.schoolRows.set(saved.schools.rows);
        }
        if (saved.edition?.id) {
            this.selectedEditionId.set(saved.edition.id);
            this.selectedEditionName.set(saved.edition.name || '');
        }
        this.createExtraAdmin.set(saved.admin.createExtraAdmin);
        if (saved.admin.name) {
            const parts = saved.admin.name.trim().split(/\s+/).filter(Boolean);
            this.adminFirstName.set(parts[0] || '');
            this.adminLastName.set(parts.slice(1).join(' ') || '');
        }
        if (saved.admin.email) this.adminEmail.set(saved.admin.email);
    }

    private persistState(): void {
        const tenantId = this.tenantService.getTenantId();
        if (!tenantId) return;
        const snapshot: TenantOnboardingState = {
            step: this.step(),
            completed: false,
            org: {
                name: this.tenantName(),
                code: this.tenantCode(),
                country: this.orgCountry(),
                contactEmail: this.orgContactEmail(),
            },
            schools: {
                mode: this.schoolMode(),
                rows: this.schoolRows(),
            },
            edition: {
                id: this.selectedEditionId(),
                name: this.selectedEditionName(),
            },
            admin: {
                createExtraAdmin: this.createExtraAdmin(),
                name: `${this.adminFirstName()} ${this.adminLastName()}`.trim(),
                email: this.adminEmail(),
            }
        };
        this.onboardingStore.save(tenantId, snapshot);
    }

    private schedulePersist(): void {
        if (this.persistTimer) {
            window.clearTimeout(this.persistTimer);
        }
        this.persistTimer = window.setTimeout(() => this.persistState(), 300);
    }

}
