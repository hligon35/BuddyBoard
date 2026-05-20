$outputPath = 'c:\Users\Harold Ligon\Desktop\MyMobileApps\BuddyBoard\communitybridge_annual_calendar.tsv'
$themes = @(
    [pscustomobject]@{ Slug='role-based-dashboards'; Headline='Clear Roles Create Better Care Days'; Prompt='clean branded healthcare-tech social graphic, white and slate background with subtle blue-green gradient accents, calm modern layout, abstract connected nodes and dashboard cards, headline centered, CommunityBridge brand feel'; FB='When every role can see what matters most, daily operations get easier to manage. CommunityBridge helps teams reduce confusion, support consistent communication, and keep care moving forward with more clarity. Request a demo to see how a more connected workflow can support your organization.'; IG='Clear roles make busy care days feel more manageable. CommunityBridge helps teams stay connected, informed, and ready to support families with more confidence. Request a demo to see the workflow in action.'; Tags='#CommunityBridge #ABATherapy #CareCoordination #HealthcareTechnology #BCBA #ClinicOperations' },
    [pscustomobject]@{ Slug='family-communication'; Headline='Family Communication Should Feel Simple'; Prompt='static branded portrait social graphic, supportive healthcare-tech style, soft green and blue accents, clean whitespace, subtle message bubbles and family-care icons, modern sans serif typography, calm reassuring composition'; FB='Families should not have to guess what comes next. CommunityBridge helps care teams share timely updates, reduce back-and-forth, and create a more confident experience for parents and caregivers. Request a demo to explore a simpler communication workflow.'; IG='Better family communication starts with clearer systems behind the scenes. CommunityBridge helps providers keep updates timely, simple, and easier for families to trust. Request a demo to learn more.'; Tags='#CommunityBridge #FamilyCommunication #ABATherapy #CareTeams #ParentSupport #HealthcareWorkflow' },
    [pscustomobject]@{ Slug='scheduling-efficiency'; Headline='Better Schedules Support Better Days'; Prompt='branded instagram portrait graphic, operational healthcare layout, minimal calendar grid elements, soft green highlight, navy and slate accents, clean modern headline space, organized and efficient visual tone'; FB='Scheduling is more than filling a calendar. CommunityBridge helps providers coordinate staff, reduce friction, and create smoother days for clinicians, office teams, and families alike. Request a demo to see a more efficient scheduling workflow.'; IG='A stronger schedule helps everyone move with less friction. CommunityBridge supports clearer planning, smoother handoffs, and better daily coordination. Request a demo to see the difference.'; Tags='#CommunityBridge #SchedulingEfficiency #ABATherapy #ClinicOperations #CareCoordination #WorkflowTools' },
    [pscustomobject]@{ Slug='billing-visibility'; Headline='Visibility Turns Billing Into Action'; Prompt='professional branded social graphic for healthcare operations, clean white background, subtle billing chart elements, blue-green gradient lines, polished admin-tech style, clear centered headline'; FB='When billing details are easier to track, teams can respond faster and plan with more confidence. CommunityBridge helps organizations improve visibility across operational workflows so fewer details get lost. Request a demo to explore smarter coordination.'; IG='More visibility means fewer surprises. CommunityBridge helps teams stay on top of operational details with clearer workflows and stronger follow-through. Request a demo to learn more.'; Tags='#CommunityBridge #BillingVisibility #HealthcareTechnology #ABATherapy #AdminEfficiency #OperationsSupport' },
    [pscustomobject]@{ Slug='reporting-insights'; Headline='Reporting Should Support Better Decisions'; Prompt='clean data-informed social graphic, branded healthcare-tech portrait design, subtle report cards and chart accents, calm professional palette, spacious layout, headline prominent and readable'; FB='Good reporting should help teams act, not slow them down. CommunityBridge supports better visibility into the information providers need so decisions can feel more timely, aligned, and practical. Request a demo to see how reporting workflows can work better.'; IG='Better reporting leads to better next steps. CommunityBridge helps teams turn information into action with more clarity and less guesswork. Request a demo to explore the workflow.'; Tags='#CommunityBridge #ReportingInsights #HealthcareWorkflow #ABATherapy #CareCoordination #OperationalClarity' },
    [pscustomobject]@{ Slug='admin-time-savings'; Headline='Save Time Where It Matters Most'; Prompt='static branded promo graphic, calm admin efficiency theme, white background, layered blue and green curves, checklist and workflow icons, modern clean typography, polished and practical'; FB='When administrative work becomes more manageable, teams get more room to focus on people. CommunityBridge helps organizations simplify coordination and reduce workflow drag across everyday tasks. Request a demo to see how your team could save time.'; IG='Less admin friction creates more room for meaningful work. CommunityBridge helps teams streamline the tasks that shape every day. Request a demo to see how it works.'; Tags='#CommunityBridge #AdminEfficiency #CareCoordination #ABATherapy #HealthcareTechnology #TeamSupport' },
    [pscustomobject]@{ Slug='care-team-coordination'; Headline='Connected Teams Create Calmer Days'; Prompt='branded care coordination graphic, portrait format, soft blue-green gradients, connected team icons, welcoming healthcare-tech aesthetic, balanced spacing, strong centered headline'; FB='Care feels stronger when teams are aligned. CommunityBridge helps clinicians, administrators, and family-facing staff stay coordinated so important details reach the right people at the right time. Request a demo to explore a more connected approach.'; IG='Connected teams can support families with more consistency and less stress. CommunityBridge helps bring the right people and information together. Request a demo to learn more.'; Tags='#CommunityBridge #CareCoordination #ABATherapy #TeamCommunication #HealthcareWorkflow #ProviderSupport' },
    [pscustomobject]@{ Slug='parent-trust'; Headline='Trust Grows Through Clear Communication'; Prompt='supportive branded social graphic, family trust theme, clean portrait layout, soft green and blue arcs, subtle family silhouettes or icons, modern calming typography'; FB='Trust is built through steady communication, clear expectations, and reliable follow-through. CommunityBridge helps organizations create a more supportive experience for families through stronger coordination. Request a demo to see how the platform supports trust at scale.'; IG='Trust grows when families feel informed and supported. CommunityBridge helps teams create a clearer experience from day to day. Request a demo to see how.'; Tags='#CommunityBridge #ParentTrust #FamilySupport #ABATherapy #CareTeams #HealthcareTechnology' },
    [pscustomobject]@{ Slug='provider-growth'; Headline='Growth Needs Systems That Scale'; Prompt='professional growth-focused healthcare graphic, clean white field, subtle upward motion elements, dashboard and team icons, blue-green brand accents, modern polished portrait composition'; FB='As organizations grow, the need for consistent systems grows with them. CommunityBridge helps providers support expansion without losing visibility, communication, or operational confidence. Request a demo to explore scalable coordination.'; IG='Growth works better when the system behind it can scale. CommunityBridge helps providers build with more visibility and confidence. Request a demo to learn more.'; Tags='#CommunityBridge #ProviderGrowth #ABATherapy #HealthcareOperations #ScalableSystems #ClinicLeadership' },
    [pscustomobject]@{ Slug='operational-clarity'; Headline='Operational Clarity Changes Everything'; Prompt='minimal branded operations graphic, portrait static design, crisp typography, subtle workflow layers and directional lines, clean healthcare-tech atmosphere, blue and green highlight accents'; FB='Operational clarity helps teams move faster with less confusion. CommunityBridge brings key workflows into one connected experience so providers can support staff and families more effectively. Request a demo to see how clearer operations can improve the day.'; IG='Clarity creates momentum. CommunityBridge helps teams simplify operations so the day can run with more confidence. Request a demo to explore the platform.'; Tags='#CommunityBridge #OperationalClarity #ClinicOperations #ABATherapy #WorkflowSupport #HealthcareTechnology' },
    [pscustomobject]@{ Slug='faq-education'; Headline='Better Questions Lead To Better Workflows'; Prompt='educational branded social graphic, portrait layout, FAQ card motif, calm healthcare-tech palette, clean whitespace, modern headline and subtle icon accents'; FB='Sometimes the best workflow improvements start with the right questions. CommunityBridge helps organizations simplify the systems behind communication, scheduling, and day-to-day coordination. Request a demo to see what a more connected workflow could look like.'; IG='Good questions often lead to stronger systems. CommunityBridge helps teams simplify everyday coordination with tools built for clarity. Request a demo to learn more.'; Tags='#CommunityBridge #ABAEducation #HealthcareWorkflow #ABATherapy #OperationsSupport #ProviderTools' },
    [pscustomobject]@{ Slug='demo-cta'; Headline='See CommunityBridge In Action'; Prompt='branded promotional static graphic, clean modern healthcare-tech style, subtle app interface cards, green call-to-action accent, white and slate composition, confident headline area'; FB='The best way to understand a stronger workflow is to see it in action. CommunityBridge helps organizations simplify communication, scheduling, coordination, and operational visibility in one connected platform. Request a demo to explore how it could support your team.'; IG='Want to see how a more connected care workflow could look for your team. Request a demo and explore CommunityBridge in action.'; Tags='#CommunityBridge #RequestADemo #ABATherapy #HealthcareTechnology #CareCoordination #ClinicOperations' }
)

$monthFocus = @{
    '2026-06' = @{ Label='Summer Operations'; Text='summer coordination and clear team communication' }
    '2026-07' = @{ Label='Midyear Momentum'; Text='midyear workflow momentum and steady communication' }
    '2026-08' = @{ Label='Back to School'; Text='back-to-school transitions and family readiness' }
    '2026-09' = @{ Label='Fall Stability'; Text='fall planning and operational consistency' }
    '2026-10' = @{ Label='Fall Planning'; Text='fall planning and stronger team alignment' }
    '2026-11' = @{ Label='Gratitude and Readiness'; Text='gratitude, family support, and year-end readiness' }
    '2026-12' = @{ Label='Year-End Reflection'; Text='year-end reflection and calm operational follow-through' }
    '2027-01' = @{ Label='New Year Reset'; Text='new year planning and operational reset' }
    '2027-02' = @{ Label='Team Trust'; Text='team trust and stronger family connection' }
    '2027-03' = @{ Label='Spring Growth'; Text='spring growth and clearer reporting rhythms' }
    '2027-04' = @{ Label='Autism Acceptance'; Text='respectful autism acceptance and family-centered support' }
    '2027-05' = @{ Label='Wellbeing and Summer Planning'; Text='mental health awareness and summer planning' }
}

function Get-ScheduledDates([datetime]$monthStart) {
    $dates = @()
    $day = Get-Date -Year $monthStart.Year -Month $monthStart.Month -Day 1
    while ($day.Month -eq $monthStart.Month -and $dates.Count -lt 12) {
        if ($day.DayOfWeek -in @('Monday','Wednesday','Friday')) {
            $dates += $day
        }
        $day = $day.AddDays(1)
    }
    return $dates
}

function Get-HolidayContext([datetime]$date, [int]$indexInMonth) {
    $ym = $date.ToString('yyyy-MM')
    switch ($ym) {
        '2026-06' { if ($date.Day -eq 19) { return 'Juneteenth' } elseif ($indexInMonth -eq 11) { return 'Summer Operations' } else { return 'None' } }
        '2026-07' { if ($date.Day -le 3) { return 'Independence Day' } else { return 'None' } }
        '2026-08' { if ($indexInMonth -ge 5 -and $indexInMonth -le 8) { return 'Back to School' } else { return 'None' } }
        '2026-09' { if ($date.Day -eq 7) { return 'Labor Day' } else { return 'None' } }
        '2026-10' { return 'None' }
        '2026-11' { if ($date.Day -ge 23) { return 'Thanksgiving Week' } else { return 'None' } }
        '2026-12' { if ($date.Day -ge 21) { return 'Year-End Reflection' } else { return 'Holiday Season' } }
        '2027-01' { if ($date.Day -le 4) { return 'New Year' } else { return 'None' } }
        '2027-02' { return 'None' }
        '2027-03' { return 'None' }
        '2027-04' { if ($indexInMonth -le 5) { return 'Autism Acceptance Month' } else { return 'None' } }
        '2027-05' { if ($indexInMonth -le 5) { return 'Mental Health Awareness Month' } elseif ($date.Day -ge 10 -and $date.Day -le 12) { return 'Mother''s Day' } else { return 'None' } }
        default { return 'None' }
    }
}

$platforms = @('Facebook', 'Instagram')
$platformCodes = @{ Facebook = 'FB'; Instagram = 'IG' }
$lines = New-Object System.Collections.Generic.List[string]
$header = 'Post ID' + "`t" + 'Campaign Name' + "`t" + 'Image Name' + "`t" + 'Platform' + "`t" + 'Graphic Headline' + "`t" + 'Image Prompt' + "`t" + 'Caption' + "`t" + 'Hashtags' + "`t" + 'Scheduled Date' + "`t" + 'Scheduled Time' + "`t" + 'Holiday Or Seasonal Context' + "`t" + 'Status' + "`t" + 'Enabled'
$lines.Add($header) | Out-Null

$contentBlockCounter = 1
for ($m = 0; $m -lt 12; $m++) {
    $monthStart = (Get-Date '2026-06-01').AddMonths($m)
    $ym = $monthStart.ToString('yyyy-MM')
    $focus = $monthFocus[$ym]
    $dates = Get-ScheduledDates $monthStart
    for ($i = 0; $i -lt 12; $i++) {
        $theme = $themes[($i + $m) % $themes.Count]
        $date = $dates[$i]
        $holiday = Get-HolidayContext $date ($i + 1)
        $imageName = $ym + '-' + $theme.Slug + '-' + ('{0:D2}' -f ($i + 1))
        $graphicHeadline = $theme.Headline

        if ($holiday -ne 'None' -and $holiday -notin @('Holiday Season', 'Summer Operations')) {
            $graphicHeadline = switch ($holiday) {
                'Juneteenth' { 'Progress Grows Through Community' }
                'Independence Day' { 'Freedom Works Best With Support' }
                'Back to School' { 'Transitions Work Better With Clarity' }
                'Labor Day' { 'Support The Teams Behind Care' }
                'Thanksgiving Week' { 'Gratitude Starts With Good Support' }
                'Year-End Reflection' { 'Reflect On What Helped Teams Thrive' }
                'New Year' { 'A New Year Starts With Clear Systems' }
                'Autism Acceptance Month' { 'Acceptance Begins With Respectful Support' }
                'Mental Health Awareness Month' { 'Support Strong Teams And Families' }
                'Mother''s Day' { 'Support Matters To Every Caregiver' }
                default { $theme.Headline }
            }
        }

        foreach ($platform in $platforms) {
            $code = $platformCodes[$platform]
            $postId = '{0}-{1}-{2:D3}' -f $date.ToString('yyyyMMdd'), $code, $contentBlockCounter
            $scheduledTime = '10:00 AM'
            $imagePrompt = $theme.Prompt + ', instagram portrait 4:5, CommunityBridge branding, ' + $focus.Label + ' emphasis, headline text ' + $graphicHeadline
            $caption = if ($platform -eq 'Facebook') { $theme.FB } else { $theme.IG }

            if ($holiday -ne 'None') {
                switch ($holiday) {
                    'Juneteenth' { $caption = if ($platform -eq 'Facebook') { 'As teams honor progress, dignity, and community, stronger support systems matter. CommunityBridge helps organizations build clearer communication and more connected day-to-day coordination for the people they serve. Request a demo to explore a more supportive workflow.' } else { 'Support, dignity, and clear communication matter in every care setting. CommunityBridge helps teams stay connected and serve families with more clarity. Request a demo to learn more.' } }
                    'Independence Day' { $caption = if ($platform -eq 'Facebook') { 'As teams move through a busy holiday week, clear systems help communication and coordination stay steady. CommunityBridge supports providers with workflows that reduce friction and keep important details visible. Request a demo to explore the platform.' } else { 'Holiday weeks still need clear coordination. CommunityBridge helps teams stay aligned and informed when schedules shift. Request a demo to see how it works.' } }
                    'Back to School' { $caption = if ($platform -eq 'Facebook') { 'Back-to-school season can bring extra moving parts for providers and families. CommunityBridge helps teams manage transitions with clearer communication, better scheduling visibility, and more confident follow-through. Request a demo to learn more.' } else { 'Back-to-school transitions work better when communication stays clear. CommunityBridge helps teams support families with steadier coordination. Request a demo to explore the workflow.' } }
                    'Labor Day' { $caption = if ($platform -eq 'Facebook') { 'The work behind quality care depends on teams having the support they need. CommunityBridge helps organizations create workflows that reduce friction and help staff stay informed, coordinated, and better equipped each day. Request a demo to see more.' } else { 'Strong care teams deserve strong systems behind them. CommunityBridge helps reduce workflow friction so teams can focus on what matters. Request a demo to learn more.' } }
                    'Thanksgiving Week' { $caption = if ($platform -eq 'Facebook') { 'Gratitude grows when teams and families feel supported in the work they do together. CommunityBridge helps organizations create clearer communication and more reliable workflows that strengthen everyday care. Request a demo to explore the platform.' } else { 'This season is a good reminder that support matters. CommunityBridge helps teams create clearer experiences for families and staff every day. Request a demo to see how.' } }
                    'Year-End Reflection' { $caption = if ($platform -eq 'Facebook') { 'Year-end is a natural time to reflect on what helped your team stay aligned, responsive, and consistent. CommunityBridge helps organizations move into the next season with stronger workflows and clearer coordination. Request a demo to explore what comes next.' } else { 'Year-end reflection can reveal what helped your team work better together. CommunityBridge supports the clarity and coordination that carry into the next season. Request a demo to learn more.' } }
                    'New Year' { $caption = if ($platform -eq 'Facebook') { 'A new year often starts with a new focus on clarity, consistency, and stronger systems. CommunityBridge helps organizations begin the year with better communication, scheduling, and operational visibility. Request a demo to see how the platform supports your team.' } else { 'A new year is a good time to build stronger systems behind everyday care. CommunityBridge helps teams start with more clarity and coordination. Request a demo to explore the platform.' } }
                    'Autism Acceptance Month' { $caption = if ($platform -eq 'Facebook') { 'Autism Acceptance Month is a reminder that respectful support starts with listening, clarity, and systems that help teams respond well. CommunityBridge helps providers strengthen communication and coordination in ways that better support families and staff. Request a demo to learn more.' } else { 'Autism Acceptance Month is a good time to center respectful support and clearer communication. CommunityBridge helps teams build workflows that better support families and staff. Request a demo to learn more.' } }
                    'Mental Health Awareness Month' { $caption = if ($platform -eq 'Facebook') { 'Mental Health Awareness Month is a reminder that strong systems can reduce friction and support wellbeing across teams and families. CommunityBridge helps organizations create clearer coordination so everyday work feels more manageable. Request a demo to explore the platform.' } else { 'Supportive systems can make everyday care work feel more manageable. CommunityBridge helps teams build clarity, communication, and steadier coordination. Request a demo to learn more.' } }
                    'Mother''s Day' { $caption = if ($platform -eq 'Facebook') { 'Caregiver support matters every day. CommunityBridge helps organizations create clearer communication and more reliable workflows that make it easier for families to stay informed and supported. Request a demo to see how the platform helps.' } else { 'Support for caregivers starts with clear communication and better follow-through. CommunityBridge helps teams create a steadier experience for families. Request a demo to learn more.' } }
                }
            }
            elseif ($platform -eq 'Facebook') {
                $caption = $caption + ' This season is a good time to focus on ' + $focus.Text + '.'
            }
            else {
                $caption = $caption + ' This season is all about ' + $focus.Text + '.'
            }

            $tags = $theme.Tags
            if ($holiday -eq 'Back to School') { $tags += ' #BackToSchool #FamilyReadiness' }
            elseif ($holiday -eq 'Labor Day') { $tags += ' #LaborDay #TeamSupport' }
            elseif ($holiday -eq 'Thanksgiving Week') { $tags += ' #Thanksgiving #GratitudeInCare' }
            elseif ($holiday -eq 'Year-End Reflection') { $tags += ' #YearEnd #ReflectAndReset' }
            elseif ($holiday -eq 'New Year') { $tags += ' #NewYear #OperationalReset' }
            elseif ($holiday -eq 'Autism Acceptance Month') { $tags += ' #AutismAcceptanceMonth #RespectfulSupport' }
            elseif ($holiday -eq 'Mental Health Awareness Month') { $tags += ' #MentalHealthAwarenessMonth #SupportiveSystems' }
            elseif ($holiday -eq 'Juneteenth') { $tags += ' #Juneteenth #CommunitySupport' }
            elseif ($holiday -eq 'Independence Day') { $tags += ' #IndependenceDay #HolidayWeek' }
            elseif ($holiday -eq 'Mother''s Day') { $tags += ' #MothersDay #CaregiverSupport' }

            $fields = @(
                $postId,
                'CommunityBridge Annual Growth Campaign 2026-2027',
                $imageName,
                $platform,
                $graphicHeadline,
                $imagePrompt,
                $caption,
                $tags,
                $date.ToString('yyyy-MM-dd'),
                $scheduledTime,
                $holiday,
                'Pending',
                'TRUE'
            ) | ForEach-Object { ("$_" -replace "`t", ' ' -replace "`r|`n", ' ').Trim() }

            $lines.Add(($fields -join "`t")) | Out-Null
        }

        $contentBlockCounter++
    }
}

Set-Content -Path $outputPath -Value $lines -Encoding UTF8
Write-Output "WROTE: $outputPath"
Write-Output "LINES: $((Get-Content $outputPath).Count)"
Write-Output "DATA_ROWS: $(((Get-Content $outputPath).Count) - 1)"
Write-Output ((Get-Content $outputPath | Select-Object -First 3) -join "`n")
