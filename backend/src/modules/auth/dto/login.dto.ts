import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: '工号不能为空' })
  employeeNo: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: '旧密码不能为空' })
  oldPassword: string;

  @IsString()
  @IsNotEmpty({ message: '新密码不能为空' })
  newPassword: string;
}
