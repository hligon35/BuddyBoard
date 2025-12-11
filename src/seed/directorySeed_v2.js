// directorySeed_v2.js
// Clean seed module exported for DataContext usage.

const raw = {
  Faculty: {
    BCBAs: [
      { BCBA_ID: 'BCBA-001', first_name: 'Dr. Sarah', last_name: 'Miller' },
      { BCBA_ID: 'BCBA-002', first_name: 'Dr. James', last_name: 'Harris' },
      { BCBA_ID: 'BCBA-003', first_name: 'Dr. Emily', last_name: 'Clark' }
    ],
    ABAs: [
      { ABA_ID: 'ABA-001', first_name: 'Daniel', last_name: 'Lopez', supervised_by: 'BCBA-001', POD_ID: 'POD-001' },
      { ABA_ID: 'ABA-002', first_name: 'Sophia', last_name: 'Nguyen', supervised_by: 'BCBA-001', POD_ID: 'POD-002' },
      { ABA_ID: 'ABA-003', first_name: 'Matthew', last_name: 'Brown', supervised_by: 'BCBA-001', POD_ID: 'POD-003' },
      { ABA_ID: 'ABA-004', first_name: 'Emily', last_name: 'Clark', supervised_by: 'BCBA-001', POD_ID: 'POD-004' },
      { ABA_ID: 'ABA-005', first_name: 'Olivia', last_name: 'Wilson', supervised_by: 'BCBA-002', POD_ID: 'POD-005' },
      { ABA_ID: 'ABA-006', first_name: 'Ethan', last_name: 'Martinez', supervised_by: 'BCBA-002', POD_ID: 'POD-006' },
      { ABA_ID: 'ABA-007', first_name: 'Grace', last_name: 'Kim', supervised_by: 'BCBA-002', POD_ID: 'POD-007' },
      { ABA_ID: 'ABA-008', first_name: 'Noah', last_name: 'Davis', supervised_by: 'BCBA-002', POD_ID: 'POD-008' },
      { ABA_ID: 'ABA-009', first_name: 'Lucas', last_name: 'Hernandez', supervised_by: 'BCBA-003', POD_ID: 'POD-009' },
      { ABA_ID: 'ABA-010', first_name: 'Ella', last_name: 'Robinson', supervised_by: 'BCBA-003', POD_ID: 'POD-010' },
      { ABA_ID: 'ABA-011', first_name: 'Jack', last_name: 'Nguyen', supervised_by: 'BCBA-003', POD_ID: 'POD-011' },
      { ABA_ID: 'ABA-012', first_name: 'Mia', last_name: 'Brown', supervised_by: 'BCBA-003', POD_ID: 'POD-012' }
    ]
  },
  Parents: [
    { PT_ID: 'PT-001', first_name: 'Carlos', last_name: 'Garcia', FM_ID: 'FM-001' },
    { PT_ID: 'PT-002', first_name: 'Ana', last_name: 'Garcia', FM_ID: 'FM-001' },
    { PT_ID: 'PT-003', first_name: 'David', last_name: 'Johnson', FM_ID: 'FM-002' },
    { PT_ID: 'PT-004', first_name: 'Melissa', last_name: 'Johnson', FM_ID: 'FM-002' },
    { PT_ID: 'PT-005', first_name: 'Phong', last_name: 'Nguyen', FM_ID: 'FM-003' },
    { PT_ID: 'PT-006', first_name: 'Linh', last_name: 'Nguyen', FM_ID: 'FM-003' },
    { PT_ID: 'PT-007', first_name: 'Angela', last_name: 'Brown', FM_ID: 'FM-004' },
    { PT_ID: 'PT-008', first_name: 'Marcus', last_name: 'Brown', FM_ID: 'FM-004' },
    { PT_ID: 'PT-009', first_name: 'Olivia', last_name: 'Wilson', FM_ID: 'FM-005' },
    { PT_ID: 'PT-010', first_name: 'Ethan', last_name: 'Wilson', FM_ID: 'FM-005' },
    { PT_ID: 'PT-011', first_name: 'Sofia', last_name: 'Hernandez', FM_ID: 'FM-006' },
    { PT_ID: 'PT-012', first_name: 'Carlos', last_name: 'Hernandez', FM_ID: 'FM-006' },
    { PT_ID: 'PT-013', first_name: 'Anna', last_name: 'Robinson', FM_ID: 'FM-007' },
    { PT_ID: 'PT-014', first_name: 'Robert', last_name: 'Robinson', FM_ID: 'FM-007' },
    { PT_ID: 'PT-015', first_name: 'Jessica', last_name: 'Martinez', FM_ID: 'FM-008' },
    { PT_ID: 'PT-016', first_name: 'Thomas', last_name: 'Martinez', FM_ID: 'FM-008' },
    { PT_ID: 'PT-017', first_name: 'Linda', last_name: 'Lopez', FM_ID: 'FM-009' },
    { PT_ID: 'PT-018', first_name: 'Mark', last_name: 'Lopez', FM_ID: 'FM-009' },
    { PT_ID: 'PT-019', first_name: 'Sophia', last_name: 'Nguyen', FM_ID: 'FM-010' },
    { PT_ID: 'PT-020', first_name: 'David', last_name: 'Nguyen', FM_ID: 'FM-010' }
  ],
  Students: [
    { ST_ID: 'ST-001', first_name: 'Mateo', last_name: 'Garcia', age: 4, FM_ID: 'FM-001', POD_ID: 'POD-001', assigned_ABA: ['ABA-001'], session: 'AM' },
    { ST_ID: 'ST-002', first_name: 'Lucia', last_name: 'Garcia', age: 3, FM_ID: 'FM-001', POD_ID: 'POD-001', assigned_ABA: ['ABA-001'], session: 'PM' },
    { ST_ID: 'ST-003', first_name: 'Diego', last_name: 'Garcia', age: 5, FM_ID: 'FM-001', POD_ID: 'POD-002', assigned_ABA: ['ABA-002'], session: 'AM' },
    { ST_ID: 'ST-004', first_name: 'Sofia', last_name: 'Garcia', age: 4, FM_ID: 'FM-001', POD_ID: 'POD-002', assigned_ABA: ['ABA-002'], session: 'PM' },
    { ST_ID: 'ST-005', first_name: 'Charlotte', last_name: 'Johnson', age: 3, FM_ID: 'FM-002', POD_ID: 'POD-003', assigned_ABA: ['ABA-003'], session: 'AM' },
    { ST_ID: 'ST-006', first_name: 'Henry', last_name: 'Johnson', age: 5, FM_ID: 'FM-002', POD_ID: 'POD-003', assigned_ABA: ['ABA-003'], session: 'PM' },
    { ST_ID: 'ST-007', first_name: 'Amelia', last_name: 'Johnson', age: 4, FM_ID: 'FM-002', POD_ID: 'POD-004', assigned_ABA: ['ABA-004'], session: 'AM' },
    { ST_ID: 'ST-008', first_name: 'Jack', last_name: 'Nguyen', age: 3, FM_ID: 'FM-003', POD_ID: 'POD-004', assigned_ABA: ['ABA-004'], session: 'PM' },
    { ST_ID: 'ST-009', first_name: 'Ella', last_name: 'Nguyen', age: 5, FM_ID: 'FM-003', POD_ID: 'POD-005', assigned_ABA: ['ABA-005'], session: 'AM' },
    { ST_ID: 'ST-010', first_name: 'William', last_name: 'Nguyen', age: 4, FM_ID: 'FM-003', POD_ID: 'POD-005', assigned_ABA: ['ABA-005'], session: 'PM' },
    { ST_ID: 'ST-011', first_name: 'Zoe', last_name: 'Brown', age: 3, FM_ID: 'FM-004', POD_ID: 'POD-006', assigned_ABA: ['ABA-006'], session: 'AM' },
    { ST_ID: 'ST-012', first_name: 'Evan', last_name: 'Kim', age: 4, FM_ID: 'FM-005', POD_ID: 'POD-006', assigned_ABA: ['ABA-006'], session: 'PM' },
    { ST_ID: 'ST-013', first_name: 'Isabella', last_name: 'Nguyen', age: 4, FM_ID: 'FM-005', POD_ID: 'POD-007', assigned_ABA: ['ABA-007'], session: 'AM' },
    { ST_ID: 'ST-014', first_name: 'Mason', last_name: 'Garcia', age: 5, FM_ID: 'FM-006', POD_ID: 'POD-008', assigned_ABA: ['ABA-008'], session: 'PM' },
    { ST_ID: 'ST-015', first_name: 'Mia', last_name: 'Johnson', age: 3, FM_ID: 'FM-007', POD_ID: 'POD-009', assigned_ABA: ['ABA-009'], session: 'AM' },
    { ST_ID: 'ST-016', first_name: 'Jacob', last_name: 'Brown', age: 4, FM_ID: 'FM-008', POD_ID: 'POD-010', assigned_ABA: ['ABA-010'], session: 'PM' }
  ]
};

// Map raw parents to app shape
const seededParents = raw.Parents.map((p) => ({
  id: p.PT_ID,
  firstName: p.first_name,
  lastName: p.last_name,
  phone: null,
  email: null,
  avatar: `https://i.pravatar.cc/100?u=${p.PT_ID}`,
  familyId: p.FM_ID,
}));

// Map raw faculty to therapists (ABAs + BCBAs)
const seededTherapists = [
  ...raw.Faculty.ABAs.map((a) => ({ id: a.ABA_ID, name: `${a.first_name} ${a.last_name}`, role: 'ABA Therapist', phone: null, email: null, avatar: `https://i.pravatar.cc/80?u=${a.ABA_ID}`, podId: a.POD_ID, supervisedBy: a.supervised_by })),
  ...raw.Faculty.BCBAs.map((b) => ({ id: b.BCBA_ID, name: `${b.first_name} ${b.last_name}`, role: 'BCBA', phone: null, email: null, avatar: `https://i.pravatar.cc/80?u=${b.BCBA_ID}` })),
];

// Map students and attach parents by FM_ID
const seededChildrenWithParents = raw.Students.map((s) => {
  const parents = seededParents.filter((p) => p.familyId === s.FM_ID).map((p) => ({ id: p.id, name: `${p.firstName} ${p.lastName}`, phone: p.phone, email: p.email, avatar: p.avatar }));
  return {
    id: s.ST_ID,
    firstName: s.first_name,
    lastName: s.last_name,
    name: `${s.first_name} ${s.last_name}`,
    age: `${s.age} yrs`,
    room: s.POD_ID || 'Unknown',
    avatar: `https://picsum.photos/seed/${s.ST_ID}/200/200`,
    parents,
    assignedABA: s.assigned_ABA || [],
    session: s.session || null,
  };
});

module.exports = { seededParents, seededTherapists, seededChildrenWithParents };
