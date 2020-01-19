import * as core from '@actions/core';

import {isValidCondition, validateStatus} from './utils';
import {Slack, SlackOptions} from './slack';

async function run() {
  try {
    const status: string = validateStatus(
      core.getInput('type', {required: true}).toLowerCase()
    );
    const jobName: string = core.getInput('job_name', {required: true});
    let mention: string = core.getInput('mention');
    let mentionCondition: string = core.getInput('mention_if').toLowerCase();
    const slackOptions: SlackOptions = {
      token: process.env.SLACK_TOKEN || core.getInput('slack_token'),
      channel: process.env.SLACK_CHANNEL || core.getInput('channel'),
      username: core.getInput('username'),
      icon_emoji: core.getInput('icon_emoji')
    };
    const commitFlag: boolean = core.getInput('commit') === 'true';
    const gitHubToken: string = core.getInput('token');

    if (mention && !isValidCondition(mentionCondition)) {
      mention = '';
      mentionCondition = '';
      console.warn(`
      Ignore slack message metion:
      mention_if: ${mentionCondition} is invalid
      `);
    }

    if (slackOptions.token === '') {
      throw new Error(`[Error] Missing Slack Token.
      Please configure "SLACK_TOKEN" as environment variable or
      specify the key called "slack_token" in "with" section.
      `);
    }

    if (slackOptions.channel === '') {
      throw new Error(`[Error] Missing Slack Channel.
      Please configure "SLACK_CHANNEL" as environment variable or
      specify the key called "channel" in "with" section.
      `);
    }

    const slack = new Slack();
    const payload = await slack.generatePayload(
      slackOptions,
      jobName,
      status,
      mention,
      mentionCondition,
      commitFlag,
      gitHubToken
    );
    console.info(`Generated payload for slack: ${JSON.stringify(payload)}`);

    await slack.notify(slackOptions.token, payload);
    console.info('Sent message to Slack');
  } catch (err) {
    core.setFailed(err.message);
  }
}

run();
