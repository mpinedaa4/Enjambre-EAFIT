import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Member } from '../../members/entities/member.entity.js';
import { Group } from './group.entity.js';
import { MemberStatus } from './member-status.entity.js';

@Entity('group_member')
@Unique(['member', 'group'])
export class GroupMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Member, (member) => member.groupMembers, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ referencedColumnName: 'id' })
  member: Member;

  @ManyToOne(() => Group, (group) => group.groupMembers, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ referencedColumnName: 'id' })
  group: Group;

  @ManyToOne(() => MemberStatus, (memberStatus) => memberStatus.groupMembers, {
    eager: true,
  })
  @JoinColumn({ referencedColumnName: 'id' })
  memberStatus: MemberStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
