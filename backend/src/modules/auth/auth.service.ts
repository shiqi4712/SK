import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcryptjs from 'bcryptjs';
import { User, UserRole, UserStatus } from '../user/user.entity';
import { LoginDto, ChangePasswordDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { employeeNo: dto.employeeNo },
    });

    if (!user) {
      throw new UnauthorizedException('工号或密码错误');
    }

    if (user.status === UserStatus.DISABLED) {
      throw new UnauthorizedException('账号已被禁用');
    }

    const isMatch = await bcryptjs.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('工号或密码错误');
    }

    const payload = { sub: user.id, role: user.role, name: user.name };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        employeeNo: user.employeeNo,
      },
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    if (dto.newPassword.length < 6) {
      throw new BadRequestException('新密码长度不能少于6位');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    if (dto.newPassword === user.employeeNo) {
      throw new BadRequestException('新密码不能与工号相同');
    }

    const isMatch = await bcryptjs.compare(dto.oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('旧密码错误');
    }

    user.passwordHash = await bcryptjs.hash(dto.newPassword, 10);
    await this.userRepo.save(user);

    return { message: '密码修改成功' };
  }

  async validateUser(userId: number) {
    return this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'name', 'role', 'employeeNo', 'status'],
    });
  }

  async createDefaultAdmin() {
    const exists = await this.userRepo.findOne({
      where: { employeeNo: 'admin' },
    });

    if (!exists) {
      const rawPassword = process.env.ADMIN_INITIAL_PASSWORD;
      if (!rawPassword) {
        console.log('未设置 ADMIN_INITIAL_PASSWORD 环境变量，跳过创建默认管理员');
        return;
      }
      const admin = this.userRepo.create({
        name: '管理员',
        employeeNo: 'admin',
        passwordHash: await bcryptjs.hash(rawPassword, 10),
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });
      await this.userRepo.save(admin);
      console.log('默认管理员已创建，密码来自环境变量 ADMIN_INITIAL_PASSWORD');
    }
  }
}
