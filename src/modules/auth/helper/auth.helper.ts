

export class AuthHelper{
    // src/utils/role-mapper.util.ts
static mapRoleIdToName(roleId: string | number): string {
  const roleMap: Record<string, string> = {
    '1': 'user',
    '2': 'admin',
    // Add more mappings as needed
  };
  
  return roleMap[roleId.toString()] || roleId.toString() || 'user';
}
 
}  